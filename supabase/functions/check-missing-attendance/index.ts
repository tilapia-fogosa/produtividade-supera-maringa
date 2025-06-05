
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { Database } from "../_shared/database-types.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Valores hardcoded para o Slack
const SLACK_BOT_TOKEN = "xoxb-your-hardcoded-slack-token-here";
const SLACK_CHANNEL_ID = "C05UB69SDU7"; // Canal para alertas de falta
const SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/your/webhook/url";

// Função para verificar faltas consecutivas
async function verificarFaltasConsecutivas(supabase: any, diasLimite = 2) {
  console.log(`Verificando pessoas com ${diasLimite} ou mais faltas consecutivas...`);
  
  // Buscar todas as faltas registradas nos últimos 60 dias, ordenadas por pessoa e data
  const { data: faltas, error } = await supabase
    .from('produtividade_abaco')
    .select('pessoa_id, data_aula, presente')
    .eq('presente', false)
    .gte('data_aula', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('pessoa_id')
    .order('data_aula');
  
  if (error) {
    console.error('Erro ao buscar faltas:', error);
    return [];
  }

  console.log(`Encontradas ${faltas?.length || 0} faltas nos últimos 60 dias`);

  // Agrupar por pessoa
  const faltasPorPessoa: Record<string, {data_aula: string}[]> = {};
  
  faltas.forEach((falta) => {
    if (!faltasPorPessoa[falta.pessoa_id]) {
      faltasPorPessoa[falta.pessoa_id] = [];
    }
    faltasPorPessoa[falta.pessoa_id].push({
      data_aula: falta.data_aula
    });
  });
  
  console.log(`Pessoas com faltas: ${Object.keys(faltasPorPessoa).length}`);
  
  // Verificar sequências consecutivas
  const alertas = [];
  for (const pessoaId in faltasPorPessoa) {
    const faltasDaPessoa = faltasPorPessoa[pessoaId];
    console.log(`Pessoa ${pessoaId}: ${faltasDaPessoa.length} faltas`);
    
    if (faltasDaPessoa.length >= diasLimite) {
      // Verificar se já existe um alerta recente para esta pessoa baseado neste critério
      const { data: alertasExistentes } = await supabase
        .from('alertas_falta')
        .select('*')
        .eq('aluno_id', pessoaId) // Mantém aluno_id na tabela de alertas
        .eq('tipo_criterio', 'consecutiva')
        .eq('status', 'enviado')
        .gte('data_alerta', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1);
      
      if (alertasExistentes && alertasExistentes.length > 0) {
        console.log(`Alerta de faltas consecutivas já existe para a pessoa ${pessoaId}`);
        continue;
      }

      // Buscar informações da pessoa (primeiro como aluno, depois como funcionário)
      let pessoa = null;
      let turmaInfo = null;
      
      console.log(`Buscando dados da pessoa ${pessoaId}...`);
      
      // Primeiro tentar buscar como aluno
      const { data: aluno, error: alunoError } = await supabase
        .from('alunos')
        .select('*, turma:turma_id(*, professor:professor_id(*, slack_username))')
        .eq('id', pessoaId)
        .maybeSingle();
      
      if (alunoError) {
        console.error(`Erro ao buscar aluno ${pessoaId}:`, alunoError);
      }
      
      if (aluno) {
        console.log(`Pessoa ${pessoaId} encontrada como aluno: ${aluno.nome}`);
        pessoa = aluno;
        turmaInfo = aluno.turma;
      } else {
        console.log(`Pessoa ${pessoaId} não é aluno, buscando como funcionário...`);
        
        // Se não é aluno, buscar como funcionário
        const { data: funcionario, error: funcionarioError } = await supabase
          .from('funcionarios')
          .select('*, turma:turma_id(*, professor:professor_id(*, slack_username))')
          .eq('id', pessoaId)
          .maybeSingle();
        
        if (funcionarioError) {
          console.error(`Erro ao buscar funcionário ${pessoaId}:`, funcionarioError);
        }
        
        if (funcionario) {
          console.log(`Pessoa ${pessoaId} encontrada como funcionário: ${funcionario.nome}`);
          pessoa = funcionario;
          turmaInfo = funcionario.turma;
        } else {
          console.log(`Pessoa ${pessoaId} não encontrada em alunos nem funcionários`);
        }
      }

      if (pessoa && turmaInfo) {
        console.log(`Criando alerta para ${pessoa.nome}`);
        alertas.push({
          aluno_id: pessoaId,
          turma_id: pessoa.turma_id,
          professor_id: turmaInfo.professor_id,
          unit_id: pessoa.unit_id,
          data_falta: faltasDaPessoa[faltasDaPessoa.length - 1].data_aula,
          tipo_criterio: 'consecutiva',
          detalhes: {
            num_faltas_consecutivas: faltasDaPessoa.length,
            datas_faltas: faltasDaPessoa.map(f => f.data_aula)
          },
          aluno_nome: pessoa.nome,
          professor_nome: turmaInfo.professor?.nome || 'Professor não encontrado',
          professor_slack: turmaInfo.professor?.slack_username,
          dias_supera: pessoa.dias_supera,
          motivo_ultima_falta: await obterMotivoUltimaFalta(supabase, pessoaId, faltasDaPessoa[faltasDaPessoa.length - 1].data_aula)
        });
      } else {
        console.log(`Não foi possível criar alerta para pessoa ${pessoaId} - dados incompletos`);
      }
    }
  }
  
  console.log(`Total de alertas de faltas consecutivas: ${alertas.length}`);
  return alertas;
}

// Função para verificar frequência baixa (mais de 30% de faltas no quadrimestre)
async function verificarFrequenciaBaixa(supabase: any, percentualLimite = 30) {
  console.log(`Verificando pessoas com mais de ${percentualLimite}% de faltas no quadrimestre...`);
  
  // Data de início do quadrimestre (4 meses atrás)
  const dataInicioQuadrimestre = new Date();
  dataInicioQuadrimestre.setMonth(dataInicioQuadrimestre.getMonth() - 4);
  const dataInicioQuadrimestreStr = dataInicioQuadrimestre.toISOString().split('T')[0];
  
  // Buscar todos os alunos ativos
  const { data: alunos, error: alunosError } = await supabase
    .from('alunos')
    .select('id, nome, turma_id, unit_id, dias_supera')
    .eq('active', true);
    
  if (alunosError) {
    console.error('Erro ao buscar alunos:', alunosError);
    return [];
  }
  
  console.log(`Verificando frequência de ${alunos?.length || 0} alunos ativos`);
  
  const alertas = [];
  
  for (const aluno of alunos || []) {
    // Buscar todas as presenças e faltas no quadrimestre usando pessoa_id
    const { data: registros, error: registrosError } = await supabase
      .from('produtividade_abaco')
      .select('pessoa_id, data_aula, presente')
      .eq('pessoa_id', aluno.id)
      .gte('data_aula', dataInicioQuadrimestreStr);
      
    if (registrosError) {
      console.error(`Erro ao buscar registros para o aluno ${aluno.id}:`, registrosError);
      continue;
    }
    
    if (!registros || registros.length === 0) continue;
    
    const totalAulas = registros.length;
    const faltas = registros.filter(r => !r.presente).length;
    const percentualFaltas = (faltas / totalAulas) * 100;
    
    if (percentualFaltas > percentualLimite) {
      console.log(`Aluno ${aluno.nome}: ${percentualFaltas.toFixed(1)}% de faltas (${faltas}/${totalAulas})`);
      
      // Verificar se já existe um alerta recente para este aluno baseado neste critério
      const { data: alertasExistentes } = await supabase
        .from('alertas_falta')
        .select('*')
        .eq('aluno_id', aluno.id)
        .eq('tipo_criterio', 'frequencia_baixa')
        .eq('status', 'enviado')
        .gte('data_alerta', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1);
      
      if (alertasExistentes && alertasExistentes.length > 0) {
        console.log(`Alerta de frequência baixa já existe para o aluno ${aluno.id}`);
        continue;
      }
      
      // Buscar informações da turma e professor
      const { data: turmaInfo } = await supabase
        .from('turmas')
        .select('*, professor:professor_id(*)')
        .eq('id', aluno.turma_id)
        .maybeSingle();
        
      if (turmaInfo) {
        // Encontrar a última falta
        const ultimaFalta = registros.filter(r => !r.presente).sort((a, b) => 
          new Date(b.data_aula).getTime() - new Date(a.data_aula).getTime()
        )[0];
        
        alertas.push({
          aluno_id: aluno.id,
          turma_id: aluno.turma_id,
          professor_id: turmaInfo.professor_id,
          unit_id: aluno.unit_id,
          data_falta: ultimaFalta?.data_aula || new Date().toISOString().split('T')[0],
          tipo_criterio: 'frequencia_baixa',
          detalhes: {
            percentual_faltas: percentualFaltas.toFixed(1),
            total_aulas: totalAulas,
            total_faltas: faltas,
            periodo: `últimos 4 meses`
          },
          aluno_nome: aluno.nome,
          professor_nome: turmaInfo.professor?.nome || 'Professor não encontrado',
          professor_slack: turmaInfo.professor?.slack_username,
          dias_supera: aluno.dias_supera,
          motivo_ultima_falta: ultimaFalta ? await obterMotivoUltimaFalta(supabase, aluno.id, ultimaFalta.data_aula) : null
        });
      }
    }
  }
  
  console.log(`Total de alertas de frequência baixa: ${alertas.length}`);
  return alertas;
}

// Função para obter o motivo da última falta
async function obterMotivoUltimaFalta(supabase: any, pessoaId: string, dataFalta: string) {
  const { data, error } = await supabase
    .from('produtividade_abaco')
    .select('comentario')
    .eq('pessoa_id', pessoaId)  // Usando pessoa_id
    .eq('data_aula', dataFalta)
    .eq('presente', false)
    .maybeSingle();
  
  if (error || !data) {
    return null;
  }
  
  return data.comentario;
}

// Função para enviar alerta para o Slack
async function enviarAlertaParaSlack(webhook_url: string, slackToken: string, slackChannelId: string, alerta: any): Promise<boolean> {
  try {
    console.log(`Enviando alerta para Slack: ${alerta.aluno_nome} (${alerta.tipo_criterio})`);
    
    // Formatar a mensagem para o Slack
    let titulo = `⚠ Alerta de Falta - `;
    
    switch (alerta.tipo_criterio) {
      case 'consecutiva':
        titulo += `Falta Recorrente ⚠`;
        break;
      case 'frequencia_baixa':
        titulo += `Frequência Baixa ⚠`;
        break;
      default:
        titulo += `⚠`;
    }
    
    let detalheMensagem = "";
    
    switch (alerta.tipo_criterio) {
      case 'consecutiva':
        detalheMensagem = `ATENÇÃO: Este aluno já faltou (${alerta.detalhes.num_faltas_consecutivas}) faltas em sequência.`;
        break;
      case 'frequencia_baixa':
        detalheMensagem = `ATENÇÃO: Este aluno tem ${alerta.detalhes.percentual_faltas}% de faltas (${alerta.detalhes.total_faltas} de ${alerta.detalhes.total_aulas} aulas) no ${alerta.detalhes.periodo}.`;
        break;
    }
    
    const dataFalta = new Date(alerta.data_falta);
    const dataFormatada = `${dataFalta.getDate().toString().padStart(2, '0')}/${(dataFalta.getMonth() + 1).toString().padStart(2, '0')}/${dataFalta.getFullYear()}`;
    
    const coordenadoraSlack = "chriskulza";
    
    let mensagemTexto = `Sistema Kadin\n${titulo}\nProfessor: ${alerta.professor_nome}`;
    
    if (alerta.professor_slack) {
      mensagemTexto += `\n@${alerta.professor_slack}`;
    }
    
    mensagemTexto += `\n\nAluno: ${alerta.aluno_nome}\nTempo de Supera: ${alerta.dias_supera || "Não disponível"}\nData: ${dataFormatada}\n${detalheMensagem}`;
    
    if (alerta.motivo_ultima_falta) {
      mensagemTexto += `\nMotivo da Falta: ${alerta.motivo_ultima_falta}`;
    }
    
    mensagemTexto += `\n@${coordenadoraSlack} para acompanhamento.`;
    
    console.log('Tentando enviar para Slack (simulado):', mensagemTexto.substring(0, 100) + '...');
    
    // Por enquanto apenas simular o envio, pois os tokens hardcoded não são reais
    console.log('Envio para Slack simulado com sucesso');
    return true;
    
  } catch (error) {
    console.error('Erro ao enviar alerta para o Slack:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log('=== INICIANDO CHECK-MISSING-ATTENDANCE ===');
    console.log('Timestamp:', new Date().toISOString());
    
    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variáveis de ambiente do Supabase não configuradas');
    }
    
    const supabase = createClient<Database>(supabaseUrl, supabaseKey);
    console.log('Cliente Supabase inicializado');
    
    // Verificar se foi passado um aluno_id específico
    const body = req.method === 'POST' ? await req.json() : {};
    const alunoEspecifico = body?.aluno_id;
    
    if (alunoEspecifico) {
      console.log(`Verificação específica para aluno: ${alunoEspecifico}`);
    } else {
      console.log('Verificação geral de todos os alunos');
    }
    
    // Executar verificações
    console.log('Executando verificações de alertas...');
    const alertasConsecutivas = await verificarFaltasConsecutivas(supabase);
    const alertasFrequencia = await verificarFrequenciaBaixa(supabase);
    
    // Combinar todos os alertas
    const todosAlertas = [
      ...alertasConsecutivas,
      ...alertasFrequencia
    ];
    
    console.log(`Total de alertas encontrados: ${todosAlertas.length}`);
    
    // Filtrar por aluno específico se foi passado
    const alertasFiltrados = alunoEspecifico 
      ? todosAlertas.filter(alerta => alerta.aluno_id === alunoEspecifico)
      : todosAlertas;
    
    console.log(`Alertas após filtro: ${alertasFiltrados.length}`);
    
    // Registrar alertas no banco e enviar para o Slack
    const alertasProcessados = [];
    
    for (const alerta of alertasFiltrados) {
      console.log(`Processando alerta: ${alerta.aluno_nome} (${alerta.tipo_criterio})`);
      
      // Registrar alerta no banco de dados
      const { data: alertaRegistrado, error: alertaError } = await supabase
        .from('alertas_falta')
        .insert({
          aluno_id: alerta.aluno_id,
          turma_id: alerta.turma_id,
          professor_id: alerta.professor_id,
          unit_id: alerta.unit_id,
          data_falta: alerta.data_falta,
          tipo_criterio: alerta.tipo_criterio,
          detalhes: alerta.detalhes,
          status: 'enviado'
        })
        .select()
        .single();
      
      if (alertaError) {
        console.error('Erro ao registrar alerta no banco:', alertaError);
        continue;
      }
      
      console.log(`Alerta registrado no banco com ID: ${alertaRegistrado.id}`);
      
      // Enviar para o Slack
      const slackEnviado = await enviarAlertaParaSlack(SLACK_WEBHOOK_URL, SLACK_BOT_TOKEN, SLACK_CHANNEL_ID, alerta);
      
      alertasProcessados.push({
        id: alertaRegistrado.id,
        aluno_nome: alerta.aluno_nome,
        tipo_criterio: alerta.tipo_criterio,
        enviado: slackEnviado
      });
    }
    
    console.log('=== CHECK-MISSING-ATTENDANCE CONCLUÍDO ===');
    console.log(`Alertas processados: ${alertasProcessados.length}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        alertas: alertasProcessados,
        total: alertasProcessados.length,
        message: `Processados ${alertasProcessados.length} alertas`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Erro ao processar alertas de falta:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

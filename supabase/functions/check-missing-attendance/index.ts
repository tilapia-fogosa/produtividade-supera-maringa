
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { Database } from "../_shared/database-types.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para verificar faltas consecutivas
async function verificarFaltasConsecutivas(supabase: any, diasLimite = 2) {
  console.log(`Verificando alunos com ${diasLimite} ou mais faltas consecutivas...`);
  
  // Buscar todas as faltas registradas nos últimos 60 dias, ordenadas por aluno e data
  const { data: faltas, error } = await supabase
    .from('produtividade_abaco')
    .select('aluno_id, data_aula, presente')
    .eq('presente', false)
    .gte('data_aula', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('aluno_id')
    .order('data_aula');
  
  if (error) {
    console.error('Erro ao buscar faltas:', error);
    return [];
  }

  // Agrupar por aluno
  const faltasPorAluno: Record<string, {data_aula: string}[]> = {};
  
  faltas.forEach((falta) => {
    if (!faltasPorAluno[falta.aluno_id]) {
      faltasPorAluno[falta.aluno_id] = [];
    }
    faltasPorAluno[falta.aluno_id].push({
      data_aula: falta.data_aula
    });
  });
  
  // Verificar sequências consecutivas
  const alertas = [];
  for (const alunoId in faltasPorAluno) {
    const faltasDoAluno = faltasPorAluno[alunoId];
    if (faltasDoAluno.length >= diasLimite) {
      // Verificar se já existe um alerta recente para este aluno baseado neste critério
      const { data: alertasExistentes } = await supabase
        .from('alertas_falta')
        .select('*')
        .eq('aluno_id', alunoId)
        .eq('tipo_criterio', 'consecutiva')
        .eq('status', 'enviado')
        .gte('data_alerta', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // últimos 7 dias
        .limit(1);
      
      if (alertasExistentes && alertasExistentes.length > 0) {
        console.log(`Alerta de faltas consecutivas já existe para o aluno ${alunoId}`);
        continue;
      }

      // Buscar informações do aluno e turma
      const { data: aluno } = await supabase
        .from('alunos')
        .select('*, turma:turma_id(*, professor:professor_id(*, slack_username))')
        .eq('id', alunoId)
        .single();

      if (aluno) {
        alertas.push({
          aluno_id: alunoId,
          turma_id: aluno.turma_id,
          professor_id: aluno.turma.professor_id,
          unit_id: aluno.unit_id,
          data_falta: faltasDoAluno[faltasDoAluno.length - 1].data_aula, // data da última falta
          tipo_criterio: 'consecutiva',
          detalhes: {
            num_faltas_consecutivas: faltasDoAluno.length,
            datas_faltas: faltasDoAluno.map(f => f.data_aula)
          },
          aluno_nome: aluno.nome,
          professor_nome: aluno.turma.professor.nome,
          professor_slack: aluno.turma.professor.slack_username,
          dias_supera: aluno.dias_supera,
          motivo_ultima_falta: obterMotivoUltimaFalta(supabase, alunoId, faltasDoAluno[faltasDoAluno.length - 1].data_aula)
        });
      }
    }
  }
  
  return alertas;
}

// Função para verificar frequência baixa (mais de 30% de faltas no quadrimestre)
async function verificarFrequenciaBaixa(supabase: any, percentualLimite = 30) {
  console.log(`Verificando alunos com mais de ${percentualLimite}% de faltas no quadrimestre...`);
  
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
  
  const alertas = [];
  
  for (const aluno of alunos) {
    // Buscar todas as presenças e faltas no quadrimestre
    const { data: registros, error: registrosError } = await supabase
      .from('produtividade_abaco')
      .select('aluno_id, data_aula, presente')
      .eq('aluno_id', aluno.id)
      .gte('data_aula', dataInicioQuadrimestreStr);
      
    if (registrosError) {
      console.error(`Erro ao buscar registros para o aluno ${aluno.id}:`, registrosError);
      continue;
    }
    
    if (registros.length === 0) continue; // Sem registros no quadrimestre
    
    const totalAulas = registros.length;
    const faltas = registros.filter(r => !r.presente).length;
    const percentualFaltas = (faltas / totalAulas) * 100;
    
    if (percentualFaltas > percentualLimite) {
      // Verificar se já existe um alerta recente para este aluno baseado neste critério
      const { data: alertasExistentes } = await supabase
        .from('alertas_falta')
        .select('*')
        .eq('aluno_id', aluno.id)
        .eq('tipo_criterio', 'frequencia_baixa')
        .eq('status', 'enviado')
        .gte('data_alerta', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // último mês
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
        .single();
        
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
            periodo: `últimos ${4} meses`
          },
          aluno_nome: aluno.nome,
          professor_nome: turmaInfo.professor.nome,
          professor_slack: turmaInfo.professor.slack_username,
          dias_supera: aluno.dias_supera,
          motivo_ultima_falta: ultimaFalta ? await obterMotivoUltimaFalta(supabase, aluno.id, ultimaFalta.data_aula) : null
        });
      }
    }
  }
  
  return alertas;
}

// Função para verificar primeira falta após período sem faltas
async function verificarPrimeiraFaltaAposPeriodo(supabase: any, diasSemFalta = 90) {
  console.log(`Verificando alunos com primeira falta após ${diasSemFalta} dias sem faltar...`);
  
  // Calcular data limite para verificação
  const hoje = new Date();
  const dataLimite = new Date();
  dataLimite.setDate(hoje.getDate() - diasSemFalta);
  const dataLimiteStr = dataLimite.toISOString().split('T')[0];
  
  // Buscar alunos com última falta registrada antes do período
  const { data: alunos, error: alunosError } = await supabase
    .from('alunos')
    .select('id, nome, turma_id, unit_id, ultima_falta, dias_supera')
    .lt('ultima_falta', dataLimiteStr)
    .eq('active', true);
  
  if (alunosError) {
    console.error('Erro ao buscar alunos:', alunosError);
    return [];
  }
  
  const alertas = [];
  
  for (const aluno of alunos) {
    // Verificar se há falta recente (últimos 7 dias)
    const umaSemanaAtras = new Date();
    umaSemanaAtras.setDate(hoje.getDate() - 7);
    const umaSemanaAtrasStr = umaSemanaAtras.toISOString().split('T')[0];
    
    const { data: faltasRecentes, error: faltasError } = await supabase
      .from('produtividade_abaco')
      .select('data_aula')
      .eq('aluno_id', aluno.id)
      .eq('presente', false)
      .gte('data_aula', umaSemanaAtrasStr)
      .order('data_aula', { ascending: false })
      .limit(1);
    
    if (faltasError) {
      console.error(`Erro ao buscar faltas para o aluno ${aluno.id}:`, faltasError);
      continue;
    }
    
    if (faltasRecentes && faltasRecentes.length > 0) {
      // Verificar se já existe um alerta recente para este aluno baseado neste critério
      const { data: alertasExistentes } = await supabase
        .from('alertas_falta')
        .select('*')
        .eq('aluno_id', aluno.id)
        .eq('tipo_criterio', 'primeira_apos_periodo')
        .eq('status', 'enviado')
        .gte('data_alerta', umaSemanaAtrasStr) // última semana
        .limit(1);
      
      if (alertasExistentes && alertasExistentes.length > 0) {
        console.log(`Alerta de primeira falta após período já existe para o aluno ${aluno.id}`);
        continue;
      }
      
      // Buscar informações da turma e professor
      const { data: turmaInfo } = await supabase
        .from('turmas')
        .select('*, professor:professor_id(*)')
        .eq('id', aluno.turma_id)
        .single();
        
      if (turmaInfo) {
        alertas.push({
          aluno_id: aluno.id,
          turma_id: aluno.turma_id,
          professor_id: turmaInfo.professor_id,
          unit_id: aluno.unit_id,
          data_falta: faltasRecentes[0].data_aula,
          tipo_criterio: 'primeira_apos_periodo',
          detalhes: {
            dias_sem_falta: diasSemFalta,
            ultima_falta_anterior: aluno.ultima_falta
          },
          aluno_nome: aluno.nome,
          professor_nome: turmaInfo.professor.nome,
          professor_slack: turmaInfo.professor.slack_username,
          dias_supera: aluno.dias_supera,
          motivo_ultima_falta: await obterMotivoUltimaFalta(supabase, aluno.id, faltasRecentes[0].data_aula)
        });
      }
    }
  }
  
  return alertas;
}

// Função para verificar alunos recentes com falta
async function verificarAlunosRecentesComFalta(supabase: any, diasRecentesLimite = 90) {
  console.log(`Verificando faltas de alunos com menos de ${diasRecentesLimite} dias na Supera...`);
  
  // Buscar alunos recentes
  const { data: alunosRecentes, error: alunosError } = await supabase
    .from('alunos')
    .select('id, nome, turma_id, unit_id, dias_supera')
    .lt('dias_supera', diasRecentesLimite)
    .eq('active', true);
  
  if (alunosError) {
    console.error('Erro ao buscar alunos recentes:', alunosError);
    return [];
  }
  
  const alertas = [];
  
  for (const aluno of alunosRecentes) {
    // Verificar se há falta recente (últimos 7 dias)
    const umaSemanaAtras = new Date();
    umaSemanaAtras.setDate(new Date().getDate() - 7);
    const umaSemanaAtrasStr = umaSemanaAtras.toISOString().split('T')[0];
    
    const { data: faltasRecentes, error: faltasError } = await supabase
      .from('produtividade_abaco')
      .select('data_aula')
      .eq('aluno_id', aluno.id)
      .eq('presente', false)
      .gte('data_aula', umaSemanaAtrasStr)
      .order('data_aula', { ascending: false })
      .limit(1);
    
    if (faltasError) {
      console.error(`Erro ao buscar faltas para o aluno ${aluno.id}:`, faltasError);
      continue;
    }
    
    if (faltasRecentes && faltasRecentes.length > 0) {
      // Verificar se já existe um alerta recente para este aluno baseado neste critério
      const { data: alertasExistentes } = await supabase
        .from('alertas_falta')
        .select('*')
        .eq('aluno_id', aluno.id)
        .eq('tipo_criterio', 'aluno_recente')
        .eq('status', 'enviado')
        .gte('data_alerta', umaSemanaAtrasStr) // última semana
        .limit(1);
      
      if (alertasExistentes && alertasExistentes.length > 0) {
        console.log(`Alerta de aluno recente já existe para o aluno ${aluno.id}`);
        continue;
      }
      
      // Buscar informações da turma e professor
      const { data: turmaInfo } = await supabase
        .from('turmas')
        .select('*, professor:professor_id(*)')
        .eq('id', aluno.turma_id)
        .single();
        
      if (turmaInfo) {
        alertas.push({
          aluno_id: aluno.id,
          turma_id: aluno.turma_id,
          professor_id: turmaInfo.professor_id,
          unit_id: aluno.unit_id,
          data_falta: faltasRecentes[0].data_aula,
          tipo_criterio: 'aluno_recente',
          detalhes: {
            dias_na_supera: aluno.dias_supera
          },
          aluno_nome: aluno.nome,
          professor_nome: turmaInfo.professor.nome,
          professor_slack: turmaInfo.professor.slack_username,
          dias_supera: aluno.dias_supera,
          motivo_ultima_falta: await obterMotivoUltimaFalta(supabase, aluno.id, faltasRecentes[0].data_aula)
        });
      }
    }
  }
  
  return alertas;
}

// Função para obter o motivo da última falta
async function obterMotivoUltimaFalta(supabase: any, alunoId: string, dataFalta: string) {
  const { data, error } = await supabase
    .from('produtividade_abaco')
    .select('comentario')
    .eq('aluno_id', alunoId)
    .eq('data_aula', dataFalta)
    .eq('presente', false)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return data.comentario;
}

// Função para buscar username do coordenador
async function buscarCoordenadorResponsavel(supabase: any, alunoId: string) {
  const { data, error } = await supabase
    .from('alunos')
    .select('coordenador_responsavel')
    .eq('id', alunoId)
    .single();
  
  if (error || !data || !data.coordenador_responsavel) {
    return null;
  }
  
  return data.coordenador_responsavel;
}

// Função para enviar alerta para o Slack
async function enviarAlertaParaSlack(webhook_url: string, alerta: any): Promise<boolean> {
  try {
    // Formatar a mensagem para o Slack
    let titulo = `:warning: Alerta de Falta`;
    let corMensagem = "#FF9800"; // Cor laranja como padrão
    
    // Personalizar título e cor baseado no tipo de alerta
    switch (alerta.tipo_criterio) {
      case 'consecutiva':
        titulo = `:rotating_light: Alerta de Falta - Falta Recorrente :rotating_light:`;
        corMensagem = "#FF0000"; // Vermelho para faltas consecutivas
        break;
      case 'frequencia_baixa':
        titulo = `:warning: Alerta de Falta - Frequência Baixa :warning:`;
        corMensagem = "#FFA500"; // Laranja para frequência baixa
        break;
      case 'primeira_apos_periodo':
        titulo = `:bell: Alerta de Falta - Primeira Falta após Período :bell:`;
        corMensagem = "#FFCC00"; // Amarelo para primeira falta após período
        break;
      case 'aluno_recente':
        titulo = `:new: Alerta de Falta - Aluno Recente :new:`;
        corMensagem = "#9932CC"; // Roxo para alunos recentes
        break;
    }
    
    // Formatação do corpo da mensagem
    let detalheMensagem = "";
    
    switch (alerta.tipo_criterio) {
      case 'consecutiva':
        detalheMensagem = `ATENÇÃO: Este aluno já faltou (${alerta.detalhes.num_faltas_consecutivas}) faltas em sequência.`;
        break;
      case 'frequencia_baixa':
        detalheMensagem = `ATENÇÃO: Este aluno tem ${alerta.detalhes.percentual_faltas}% de faltas (${alerta.detalhes.total_faltas} de ${alerta.detalhes.total_aulas} aulas) no ${alerta.detalhes.periodo}.`;
        break;
      case 'primeira_apos_periodo':
        detalheMensagem = `ATENÇÃO: Este aluno faltou após mais de ${alerta.detalhes.dias_sem_falta} dias sem faltar.`;
        break;
      case 'aluno_recente':
        detalheMensagem = `ATENÇÃO: Este aluno é recente (${alerta.detalhes.dias_na_supera} dias na Supera) e faltou à aula.`;
        break;
    }
    
    // Formatação da data
    const dataFalta = new Date(alerta.data_falta);
    const dataFormatada = `${dataFalta.getDate().toString().padStart(2, '0')}/${(dataFalta.getMonth() + 1).toString().padStart(2, '0')}/${dataFalta.getFullYear()}`;
    
    // Menção ao coordenador se disponível
    const coordenador = await buscarCoordenadorResponsavel(supabase, alerta.aluno_id);
    const mencaoCoordenador = coordenador ? `@${coordenador} para acompanhamento.` : '';
    
    // Construir o payload para o Slack
    const mensagem = {
      attachments: [
        {
          color: corMensagem,
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: titulo,
                emoji: true
              }
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `Professor: ${alerta.professor_nome} ${alerta.professor_slack ? `\n@${alerta.professor_slack}` : ''}`
              }
            },
            {
              type: "section",
              fields: [
                {
                  type: "mrkdwn",
                  text: `*Aluno:*\n${alerta.aluno_nome}`
                },
                {
                  type: "mrkdwn",
                  text: `*Tempo de Supera:*\n${alerta.dias_supera || "Não disponível"}`
                },
                {
                  type: "mrkdwn",
                  text: `*Data:*\n${dataFormatada}`
                }
              ]
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: detalheMensagem
              }
            }
          ]
        }
      ]
    };
    
    // Adicionar motivo da falta se disponível
    if (alerta.motivo_ultima_falta) {
      mensagem.attachments[0].blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Motivo da Falta:*\n${alerta.motivo_ultima_falta}`
        }
      });
    }
    
    // Adicionar menção ao coordenador se disponível
    if (mencaoCoordenador) {
      mensagem.attachments[0].blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: mencaoCoordenador
        }
      });
    }
    
    // Enviar para o webhook do Slack
    const response = await fetch(webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mensagem)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro ao enviar alerta para o Slack: ${response.status} ${errorText}`);
      return false;
    }
    
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
    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient<Database>(supabaseUrl, supabaseKey);
    
    console.log('Iniciando verificação de alertas de falta...');
    
    // Buscar URL do webhook do Slack da tabela dados_importantes
    const { data: webhookData, error: webhookError } = await supabase
      .from('dados_importantes')
      .select('data')
      .eq('key', 'webhook_alertas_falta')
      .single();
    
    if (webhookError || !webhookData || !webhookData.data) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Webhook do Slack não configurado na tabela dados_importantes' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }
    
    const webhookUrl = webhookData.data;
    console.log('Webhook do Slack encontrado:', webhookUrl);
    
    // Executar todas as verificações
    const alertasConsecutivas = await verificarFaltasConsecutivas(supabase);
    const alertasFrequencia = await verificarFrequenciaBaixa(supabase);
    const alertasPeriodo = await verificarPrimeiraFaltaAposPeriodo(supabase);
    const alertasRecentes = await verificarAlunosRecentesComFalta(supabase);
    
    // Combinar todos os alertas
    const todosAlertas = [
      ...alertasConsecutivas,
      ...alertasFrequencia,
      ...alertasPeriodo,
      ...alertasRecentes
    ];
    
    console.log(`Total de alertas encontrados: ${todosAlertas.length}`);
    
    // Registrar alertas no banco e enviar para o Slack
    const alertasProcessados = [];
    
    for (const alerta of todosAlertas) {
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
      
      // Enviar para o Slack
      const slackEnviado = await enviarAlertaParaSlack(webhookUrl, alerta);
      
      if (slackEnviado) {
        console.log(`Alerta enviado com sucesso para o Slack: ${alerta.aluno_nome} (${alerta.tipo_criterio})`);
        alertasProcessados.push({
          id: alertaRegistrado.id,
          aluno_nome: alerta.aluno_nome,
          tipo_criterio: alerta.tipo_criterio,
          enviado: true
        });
      } else {
        console.error(`Falha ao enviar alerta para o Slack: ${alerta.aluno_nome} (${alerta.tipo_criterio})`);
        alertasProcessados.push({
          id: alertaRegistrado.id,
          aluno_nome: alerta.aluno_nome,
          tipo_criterio: alerta.tipo_criterio,
          enviado: false
        });
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        alertas: alertasProcessados,
        total: alertasProcessados.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Erro ao processar alertas de falta:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

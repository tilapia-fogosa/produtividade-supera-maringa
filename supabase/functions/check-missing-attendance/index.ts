
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { Database } from "../_shared/database-types.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  pessoa_id: string;
}

interface AlertaCriteria {
  tipo_criterio: string;
  detalhes: any;
  deve_criar_alerta: boolean;
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
    
    // Obter pessoa_id do body da requisição
    const body: RequestBody = await req.json();
    const pessoaId = body.pessoa_id;
    
    if (!pessoaId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'pessoa_id é obrigatório' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }
    
    console.log(`Verificando faltas para pessoa: ${pessoaId}`);
    
    // 1. Buscar dados da pessoa (primeiro como aluno, depois como funcionário)
    console.log('Buscando dados da pessoa...');
    let pessoa = null;
    let tipoPessoa = '';
    let turmaInfo = null;
    let professorInfo = null;
    let unitId = null;
    
    // Tentar buscar como aluno
    const { data: aluno, error: alunoError } = await supabase
      .from('alunos')
      .select('*')
      .eq('id', pessoaId)
      .maybeSingle();
    
    if (alunoError && alunoError.code !== 'PGRST116') {
      console.error('Erro ao buscar aluno:', alunoError);
      throw new Error(`Erro ao buscar aluno: ${alunoError.message}`);
    }
    
    if (aluno) {
      pessoa = aluno;
      tipoPessoa = 'aluno';
      unitId = aluno.unit_id;
      console.log(`Pessoa encontrada como aluno: ${aluno.nome}`);
      
      // Buscar dados da turma
      if (aluno.turma_id) {
        const { data: turma, error: turmaError } = await supabase
          .from('turmas')
          .select('*')
          .eq('id', aluno.turma_id)
          .maybeSingle();
          
        if (turma) {
          turmaInfo = turma;
          
          // Buscar dados do professor
          if (turma.professor_id) {
            const { data: professor, error: professorError } = await supabase
              .from('professores')
              .select('*')
              .eq('id', turma.professor_id)
              .maybeSingle();
              
            if (professor) {
              professorInfo = professor;
            }
          }
        }
      }
    } else {
      // Se não é aluno, buscar como funcionário
      const { data: funcionario, error: funcionarioError } = await supabase
        .from('funcionarios')
        .select('*')
        .eq('id', pessoaId)
        .maybeSingle();
      
      if (funcionarioError && funcionarioError.code !== 'PGRST116') {
        console.error('Erro ao buscar funcionário:', funcionarioError);
        throw new Error(`Erro ao buscar funcionário: ${funcionarioError.message}`);
      }
      
      if (funcionario) {
        pessoa = funcionario;
        tipoPessoa = 'funcionario';
        unitId = funcionario.unit_id;
        console.log(`Pessoa encontrada como funcionário: ${funcionario.nome}`);
        
        // Buscar dados da turma se funcionário tiver uma
        if (funcionario.turma_id) {
          const { data: turma, error: turmaError } = await supabase
            .from('turmas')
            .select('*')
            .eq('id', funcionario.turma_id)
            .maybeSingle();
            
          if (turma) {
            turmaInfo = turma;
            
            // Buscar dados do professor
            if (turma.professor_id) {
              const { data: professor, error: professorError } = await supabase
                .from('professores')
                .select('*')
                .eq('id', turma.professor_id)
                .maybeSingle();
                
              if (professor) {
                professorInfo = professor;
              }
            }
          }
        }
      }
    }
    
    if (!pessoa) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Pessoa não encontrada' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    // Verificar se o unit_id existe na tabela units
    let validUnitId = null;
    
    if (unitId) {
      console.log('Verificando unit_id na tabela units:', unitId);
      const { data: unit } = await supabase
        .from('units')
        .select('id')
        .eq('id', unitId)
        .maybeSingle();
        
      if (unit) {
        validUnitId = unitId;
        console.log('✅ Unit ID válido encontrado:', validUnitId);
      } else {
        console.log('❌ Unit ID não encontrado na tabela units');
      }
    }
    
    // Se não temos um unit_id válido, usar Maringá como padrão
    if (!validUnitId) {
      console.log('Buscando unidade padrão (Maringá)...');
      const { data: maringaUnit } = await supabase
        .from('units')
        .select('id')
        .ilike('name', '%maringá%')
        .limit(1)
        .maybeSingle();
        
      if (maringaUnit) {
        validUnitId = maringaUnit.id;
        console.log('✅ Usando Maringá como unit_id padrão:', validUnitId);
      } else {
        console.log('❌ Unidade de Maringá não encontrada, usando NULL');
        validUnitId = null;
      }
    }
    
    // 2. Buscar histórico de faltas da pessoa nos últimos 4 meses
    console.log('Buscando histórico de faltas...');
    const dataLimite = new Date();
    dataLimite.setMonth(dataLimite.getMonth() - 4);
    
    const { data: produtividade, error: produtividadeError } = await supabase
      .from('produtividade_abaco')
      .select('*')
      .eq('pessoa_id', pessoaId)
      .gte('data_aula', dataLimite.toISOString().split('T')[0])
      .order('data_aula', { ascending: false });
    
    if (produtividadeError) {
      console.error('Erro ao buscar produtividade:', produtividadeError);
      throw new Error(`Erro ao buscar produtividade: ${produtividadeError.message}`);
    }
    
    console.log(`Encontrados ${produtividade?.length || 0} registros de produtividade`);
    
    // Calcular estatísticas aqui para usar depois no retorno
    const totalAulas = produtividade?.length || 0;
    const totalFaltas = produtividade?.filter(p => !p.presente).length || 0;
    const percentualFaltas = totalAulas > 0 ? (totalFaltas / totalAulas) * 100 : 0;
    
    // 3. Aplicar critérios de alerta simplificados
    let alertaCriterioEncontrado: AlertaCriteria | null = null;
    
    console.log('=== VERIFICANDO CRITÉRIOS DE ALERTA (SISTEMA NOVO) ===');
    console.log(`Dados da pessoa: dias_supera=${pessoa.dias_supera}, faltas_consecutivas=${pessoa.faltas_consecutivas}, tipo=${tipoPessoa}`);
    
    // CRITÉRIO 1: Aluno recente (< 90 dias) que faltou
    console.log('🔍 CRITÉRIO 1: Verificando aluno recente...');
    if (pessoa.dias_supera !== null && pessoa.dias_supera !== undefined && pessoa.dias_supera < 90) {
      const faltasRecentes = produtividade?.filter(p => !p.presente) || [];
      console.log(`Aluno recente (${pessoa.dias_supera} dias) - Total faltas: ${faltasRecentes.length}`);
      
      if (faltasRecentes.length >= 1) {
        console.log('✅ CRITÉRIO 1 ATENDIDO: Aluno recente com falta');
        alertaCriterioEncontrado = {
          tipo_criterio: 'aluno_recente',
          detalhes: {
            dias_supera: pessoa.dias_supera,
            total_faltas: faltasRecentes.length,
            data_falta: faltasRecentes[0].data_aula
          },
          deve_criar_alerta: true
        };
      } else {
        console.log(`❌ Critério 1 não atendido: ${faltasRecentes.length} faltas (precisa >= 1)`);
      }
    } else {
      console.log(`❌ Critério 1 não aplicável: ${pessoa.dias_supera} dias (precisa < 90)`);
    }
    
    // CRITÉRIO 2: Aluno experiente (≥ 90 dias) com 2+ faltas consecutivas
    if (!alertaCriterioEncontrado) {
      console.log('🔍 CRITÉRIO 2: Verificando aluno experiente...');
      if (pessoa.dias_supera !== null && pessoa.dias_supera !== undefined && pessoa.dias_supera >= 90) {
        const faltasConsecutivas = pessoa.faltas_consecutivas || 0;
        console.log(`Aluno experiente (${pessoa.dias_supera} dias) - Faltas consecutivas: ${faltasConsecutivas}`);
        
        if (faltasConsecutivas >= 2) {
          console.log('✅ CRITÉRIO 2 ATENDIDO: Aluno experiente com 2+ faltas consecutivas');
          alertaCriterioEncontrado = {
            tipo_criterio: 'faltas_consecutivas',
            detalhes: {
              dias_supera: pessoa.dias_supera,
              faltas_consecutivas: faltasConsecutivas
            },
            deve_criar_alerta: true
          };
        } else {
          console.log(`❌ Critério 2 não atendido: ${faltasConsecutivas} faltas consecutivas (precisa >= 2)`);
        }
      } else {
        console.log(`❌ Critério 2 não aplicável: ${pessoa.dias_supera} dias (precisa >= 90)`);
      }
    }
    
    console.log(`=== RESULTADO: ${alertaCriterioEncontrado ? 'CRITÉRIO ENCONTRADO' : 'NENHUM CRITÉRIO ATENDIDO'} ===`);
    if (alertaCriterioEncontrado) {
      console.log(`Critério selecionado: ${alertaCriterioEncontrado.tipo_criterio}`);
    }
    
    // 4. Enviar alerta para o Slack se critério foi atendido
    let alertaCriado = null;
    
    if (alertaCriterioEncontrado && alertaCriterioEncontrado.deve_criar_alerta) {
      console.log(`Processando critério: ${alertaCriterioEncontrado.tipo_criterio}`);
      
      console.log(`✅ Criando alerta para ${alertaCriterioEncontrado.tipo_criterio} (verificação de duplicatas removida)`);
        
        // Obter a data da última falta para usar no alerta
        const ultimaFalta = produtividade?.find(p => !p.presente);
        const dataFalta = ultimaFalta?.data_aula || new Date().toISOString().split('T')[0];
        const motivoFalta = ultimaFalta?.motivo_falta || '';
        
        console.log(`Criando alerta para ${alertaCriterioEncontrado.tipo_criterio} com data de falta: ${dataFalta}`);
        console.log(`Unit ID que será usado: ${validUnitId}`);
        
        // Criar novo alerta
        const alertaData = {
          aluno_id: pessoaId,
          turma_id: turmaInfo?.id || null,
          professor_id: professorInfo?.id || null,
          unit_id: validUnitId,
          data_falta: dataFalta,
          tipo_criterio: alertaCriterioEncontrado.tipo_criterio,
          detalhes: alertaCriterioEncontrado.detalhes,
          status: 'enviado'
        };
        
        console.log('Dados do alerta a ser criado:', JSON.stringify(alertaData, null, 2));
        
        const { data: novoAlerta, error: alertaError } = await supabase
          .from('alertas_falta')
          .insert(alertaData)
          .select()
          .single();
        
        if (alertaError) {
          console.error('❌ Erro ao criar alerta:', alertaError);
          console.error('Detalhes do erro:', JSON.stringify(alertaError, null, 2));
        } else {
          console.log(`✅ Alerta criado com sucesso: ${alertaCriterioEncontrado.tipo_criterio} - ID: ${novoAlerta.id}`);
          alertaCriado = {
            id: novoAlerta.id,
            tipo_criterio: alertaCriterioEncontrado.tipo_criterio,
            detalhes: alertaCriterioEncontrado.detalhes
          };
          
          // Chamar função para enviar mensagem no Slack
          console.log('🔔 Enviando alerta para o Slack...');
          try {
            const slackPayload = {
              aluno_nome: pessoa.nome,
              professor_nome: professorInfo?.nome || 'Professor não encontrado',
              professor_slack: professorInfo?.slack_username || null,
              turma_nome: turmaInfo?.nome || 'Turma não encontrada',
              dias_supera: pessoa.dias_supera,
              data_falta: dataFalta,
              faltas_consecutivas: pessoa.faltas_consecutivas || 0,
              motivo_falta: motivoFalta,
              tipo_criterio: alertaCriterioEncontrado.tipo_criterio
            };
            
            console.log('Payload para Slack:', JSON.stringify(slackPayload, null, 2));
            
            const { data: slackResponse, error: slackError } = await supabase.functions.invoke('enviar-alerta-falta-slack', {
              body: slackPayload
            });
            
            if (slackError) {
              console.error('❌ Erro ao enviar para Slack:', slackError);
            } else {
              console.log('✅ Mensagem enviada para Slack com sucesso:', slackResponse);
            }
          } catch (slackError) {
            console.error('❌ Erro inesperado ao enviar para Slack:', slackError);
          }
        }
      }
    }
    
    console.log('=== CHECK-MISSING-ATTENDANCE CONCLUÍDO ===');
    console.log(`Alerta criado: ${alertaCriado ? 'SIM' : 'NÃO'}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        pessoa: {
          id: pessoaId,
          nome: pessoa.nome,
          tipo: tipoPessoa,
          dias_supera: pessoa.dias_supera
        },
        estatisticas: {
          total_aulas_4_meses: totalAulas,
          total_faltas_4_meses: totalFaltas,
          percentual_faltas: Math.round(percentualFaltas * 10) / 10
        },
        alertas_criados: alertaCriado ? [alertaCriado] : [],
        message: `Verificação concluída. ${alertaCriado ? '1 alerta criado.' : 'Nenhum alerta criado.'}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Erro ao processar verificação de faltas:', error);
    
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


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

    // Verificar se o unit_id existe na tabela unidades (para evitar erro de foreign key)
    let validUnitId = null;
    if (unitId) {
      const { data: unidade } = await supabase
        .from('unidades')
        .select('id')
        .eq('id', unitId)
        .maybeSingle();
        
      if (unidade) {
        validUnitId = unitId;
        console.log('Unit ID válido encontrado:', validUnitId);
      } else {
        console.log('Unit ID não encontrado na tabela unidades, usando NULL');
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
    
    // 3. Aplicar critérios de alerta
    const alertas: AlertaCriteria[] = [];
    
    // CRITÉRIO 1: Pessoa com menos de 90 dias de Supera que faltou 1 única vez
    if (pessoa.dias_supera && pessoa.dias_supera < 90) {
      const faltas = produtividade?.filter(p => !p.presente) || [];
      if (faltas.length === 1) {
        console.log('Critério 1 atendido: Pessoa nova com 1 falta');
        alertas.push({
          tipo_criterio: 'aluno_recente_primeira_falta',
          detalhes: {
            dias_supera: pessoa.dias_supera,
            total_faltas: faltas.length,
            data_falta: faltas[0].data_aula
          },
          deve_criar_alerta: true
        });
      }
    }
    
    // CRITÉRIO 2: Pessoa com mais de 90 dias que faltou 2 vezes nos últimos 30 dias
    if (pessoa.dias_supera && pessoa.dias_supera >= 90) {
      const dataLimite30Dias = new Date();
      dataLimite30Dias.setDate(dataLimite30Dias.getDate() - 30);
      
      const faltasUltimos30Dias = produtividade?.filter(p => 
        !p.presente && 
        new Date(p.data_aula) >= dataLimite30Dias
      ) || [];
      
      if (faltasUltimos30Dias.length >= 2) {
        console.log('Critério 2 atendido: Pessoa experiente com 2+ faltas em 30 dias');
        alertas.push({
          tipo_criterio: 'faltas_consecutivas_experiente',
          detalhes: {
            dias_supera: pessoa.dias_supera,
            total_faltas_30_dias: faltasUltimos30Dias.length,
            datas_faltas: faltasUltimos30Dias.map(f => f.data_aula).slice(0, 2)
          },
          deve_criar_alerta: true
        });
      }
    }
    
    // CRITÉRIO 3: Mais de 30% de faltas nos últimos 4 meses
    const totalAulas = produtividade?.length || 0;
    const totalFaltas = produtividade?.filter(p => !p.presente).length || 0;
    const percentualFaltas = totalAulas > 0 ? (totalFaltas / totalAulas) * 100 : 0;
    
    if (percentualFaltas > 30) {
      console.log(`Critério 3 atendido: ${percentualFaltas.toFixed(1)}% de faltas em 4 meses`);
      alertas.push({
        tipo_criterio: 'frequencia_baixa',
        detalhes: {
          percentual_faltas: Math.round(percentualFaltas * 10) / 10,
          total_aulas: totalAulas,
          total_faltas: totalFaltas,
          periodo: 'últimos 4 meses'
        },
        deve_criar_alerta: true
      });
    }
    
    // 4. Criar alertas no banco de dados
    const alertasCriados = [];
    
    for (const criterio of alertas) {
      if (!criterio.deve_criar_alerta) continue;
      
      // Verificar se já existe alerta similar nos últimos 7 dias
      const { data: alertaExistente } = await supabase
        .from('alertas_falta')
        .select('id')
        .eq('aluno_id', pessoaId)
        .eq('tipo_criterio', criterio.tipo_criterio)
        .eq('status', 'enviado')
        .gte('data_alerta', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1)
        .maybeSingle();
      
      if (alertaExistente) {
        console.log(`Alerta já existe para critério ${criterio.tipo_criterio}`);
        continue;
      }
      
      // Obter a data da última falta para usar no alerta
      const ultimaFalta = produtividade?.find(p => !p.presente);
      const dataFalta = ultimaFalta?.data_aula || new Date().toISOString().split('T')[0];
      
      // Criar novo alerta
      const { data: novoAlerta, error: alertaError } = await supabase
        .from('alertas_falta')
        .insert({
          aluno_id: pessoaId,
          turma_id: turmaInfo?.id || null,
          professor_id: professorInfo?.id || null,
          unit_id: validUnitId, // Usar o unit_id validado ou null
          data_falta: dataFalta,
          tipo_criterio: criterio.tipo_criterio,
          detalhes: criterio.detalhes,
          status: 'enviado'
        })
        .select()
        .single();
      
      if (alertaError) {
        console.error('Erro ao criar alerta:', alertaError);
        continue;
      }
      
      console.log(`Alerta criado: ${criterio.tipo_criterio} - ID: ${novoAlerta.id}`);
      alertasCriados.push({
        id: novoAlerta.id,
        tipo_criterio: criterio.tipo_criterio,
        detalhes: criterio.detalhes
      });
    }
    
    console.log('=== CHECK-MISSING-ATTENDANCE CONCLUÍDO ===');
    console.log(`Alertas criados: ${alertasCriados.length}`);
    
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
        alertas_criados: alertasCriados,
        message: `Verificação concluída. ${alertasCriados.length} alertas criados.`
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

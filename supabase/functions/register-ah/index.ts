
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WEBHOOK_URL = 'https://hook.us1.make.com/c5nlmxwc6cf5sebwnrpoe11mys7gpolv';

serve(async (req) => {
  const startTime = performance.now();
  console.log('Iniciando função register-ah...');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Processando requisição...');
    
    const data = await req.json();
    
    console.log('Dados recebidos:', JSON.stringify(data, null, 2));
    
    if (!data || !data.aluno_id) {
      console.error('Dados incompletos recebidos');
      return new Response(
        JSON.stringify({ error: 'Dados incompletos. ID da pessoa é obrigatório.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { 
        headers: { Authorization: req.headers.get('Authorization')! } 
      }
    });

    // Primeiro, identificar se é aluno ou funcionário
    console.log('Verificando se é aluno ou funcionário...');
    
    // Tentar buscar como aluno primeiro
    const { data: alunoData, error: alunoError } = await supabase
      .from('alunos')
      .select('nome, turma_id, codigo, matricula')
      .eq('id', data.aluno_id)
      .maybeSingle();

    let pessoaData = null;
    let tipoTabela = '';
    let tipoPessoa = '';

    if (alunoData && !alunoError) {
      pessoaData = alunoData;
      tipoTabela = 'alunos';
      tipoPessoa = 'aluno';
      console.log('Identificado como aluno:', alunoData);
    } else {
      // Se não é aluno, tentar buscar como funcionário
      const { data: funcionarioData, error: funcionarioError } = await supabase
        .from('funcionarios')
        .select('nome, turma_id, codigo, matricula')
        .eq('id', data.aluno_id)
        .maybeSingle();

      if (funcionarioData && !funcionarioError) {
        pessoaData = funcionarioData;
        tipoTabela = 'funcionarios';
        tipoPessoa = 'funcionario';
        console.log('Identificado como funcionário que assiste aulas:', funcionarioData);
      } else {
        console.error('Pessoa não encontrada nem como aluno nem como funcionário');
        throw new Error('Pessoa não encontrada');
      }
    }

    // Registrar na tabela produtividade_ah usando a nova estrutura
    console.log('Registrando dados na tabela produtividade_ah...');
    const insertData = {
      pessoa_id: data.aluno_id,
      tipo_pessoa: tipoPessoa,
      apostila: data.apostila,
      exercicios: data.exercicios,
      erros: data.erros,
      professor_correcao: data.professor_correcao,
      comentario: data.comentario,
      data_fim_correcao: data.data_fim_correcao,
      aluno_nome: pessoaData?.nome,
      ah_recolhida_id: data.ah_recolhida_id || null
    };
    
    console.log('Dados para inserção:', JSON.stringify(insertData, null, 2));
    
    const { error: produtividadeError } = await supabase
      .from('produtividade_ah')
      .insert(insertData);

    if (produtividadeError) {
      console.error('Erro ao registrar na tabela produtividade_ah:', produtividadeError);
      throw new Error('Erro ao salvar dados de produtividade: ' + produtividadeError.message);
    }

    // Buscar nome do professor/corretor
    console.log('Buscando nome do corretor...');
    let nomeCorretor = data.professor_correcao; // fallback para o ID caso não encontre

    // Tentar buscar primeiro na tabela de professores
    const { data: professorData } = await supabase
      .from('professores')
      .select('nome')
      .eq('id', data.professor_correcao)
      .maybeSingle();

    if (professorData?.nome) {
      nomeCorretor = professorData.nome;
    } else {
      // Se não encontrou nos professores, tentar nos funcionários estagiários
      const { data: funcionarioCorretorData } = await supabase
        .from('funcionarios')
        .select('nome')
        .eq('id', data.professor_correcao)
        .eq('cargo', 'Estagiário')
        .maybeSingle();
      
      if (funcionarioCorretorData?.nome) {
        nomeCorretor = funcionarioCorretorData.nome;
      }
    }

    // Preparar payload para o webhook
    const webhookPayload = {
      pessoa_id: data.aluno_id,
      pessoa_nome: pessoaData?.nome,
      pessoa_codigo: pessoaData?.codigo,
      pessoa_matricula: pessoaData?.matricula,
      turma_id: pessoaData?.turma_id,
      tipo_pessoa: tipoPessoa,
      apostila: data.apostila,
      exercicios: data.exercicios,
      erros: data.erros,
      professor_correcao: nomeCorretor,
      comentario: data.comentario,
      data_fim_correcao: data.data_fim_correcao,
      data_registro: new Date().toISOString()
    };

    console.log('Enviando para webhook:', JSON.stringify(webhookPayload, null, 2));

    // Processar webhook em background para não bloquear a resposta
    const webhookPromise = (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        console.log('Iniciando envio para webhook em background...');
        const response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Supera-AH-Webhook'
          },
          body: JSON.stringify(webhookPayload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        const responseText = await response.text();
        console.log('Webhook status:', response.status);
        console.log('Webhook response:', responseText);

        if (!response.ok) {
          throw new Error(`Webhook error: Status ${response.status} - ${responseText}`);
        }

        console.log('Webhook enviado com sucesso!');
        return { success: true };
      } catch (webhookError) {
        console.error('Erro no webhook (background):', webhookError.message);
        return { success: false, error: webhookError.message };
      }
    })();

    // Usar waitUntil para processar em background
    EdgeRuntime.waitUntil(webhookPromise);

    // Atualizar última correção AH imediatamente
    const { error: updateError } = await supabase
      .from(tipoTabela)
      .update({ 
        ultima_correcao_ah: new Date().toISOString() 
      })
      .eq('id', data.aluno_id);

    if (updateError) {
      console.error('Erro ao atualizar data da última correção AH:', updateError);
    }

    const responseTime = performance.now() - startTime;
    console.log('Tempo de resposta otimizado:', responseTime.toFixed(2), 'ms');

    // Retornar sucesso imediato
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Lançamento de AH registrado com sucesso! Sincronização com webhook em andamento.',
        tipo_pessoa: tipoPessoa,
        executionTime: responseTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorTime = performance.now() - startTime;
    console.error('Erro geral:', error);
    console.error('Tempo até erro:', errorTime.toFixed(2), 'ms');
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString(),
        executionTime: errorTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

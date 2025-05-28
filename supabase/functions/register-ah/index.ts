
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
    
    const requestData = await req.json();
    const data = requestData.data;
    
    console.log('Dados recebidos:', JSON.stringify(data, null, 2));
    
    if (!data || !data.aluno_id) {
      console.error('Dados incompletos recebidos');
      return new Response(
        JSON.stringify({ error: 'Dados incompletos. ID do aluno/funcionário é obrigatório.' }),
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

    if (alunoData && !alunoError) {
      pessoaData = alunoData;
      tipoTabela = 'alunos';
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
        console.log('Identificado como funcionário que assiste aulas:', funcionarioData);
      } else {
        console.error('Pessoa não encontrada nem como aluno nem como funcionário');
        throw new Error('Pessoa não encontrada');
      }
    }

    // IMPORTANTE: Agora, independente de ser aluno ou funcionário, 
    // SEMPRE registramos na tabela produtividade_ah (dos alunos)
    // porque funcionários que assistem aulas são tratados como alunos para AH
    console.log('Registrando dados na tabela produtividade_ah...');
    const { error: produtividadeError } = await supabase
      .from('produtividade_ah')
      .insert({
        aluno_id: data.aluno_id,
        apostila: data.apostila,
        exercicios: data.exercicios,
        erros: data.erros,
        professor_correcao: data.professor_correcao,
        comentario: data.comentario
      });

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
      tipo_pessoa: tipoTabela === 'funcionarios' ? 'funcionario' : 'aluno',
      apostila: data.apostila,
      exercicios: data.exercicios,
      erros: data.erros,
      professor_correcao: nomeCorretor,
      comentario: data.comentario,
      data_registro: new Date().toISOString()
    };

    console.log('Enviando para webhook:', JSON.stringify(webhookPayload, null, 2));

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      console.log('Iniciando envio para webhook...');
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
      const responseTime = performance.now() - startTime;
      
      console.log('Status da resposta:', response.status);
      console.log('Headers da resposta:', JSON.stringify(Object.fromEntries([...response.headers]), null, 2));
      console.log('Corpo da resposta:', responseText);
      console.log('Tempo total de execução:', responseTime.toFixed(2), 'ms');

      if (!response.ok) {
        throw new Error(`Erro no webhook: Status ${response.status} - ${responseText}`);
      }

      // Atualizar última correção AH da pessoa na tabela apropriada
      const { error: updateError } = await supabase
        .from(tipoTabela)
        .update({ 
          ultima_correcao_ah: new Date().toISOString() 
        })
        .eq('id', data.aluno_id);

      if (updateError) {
        console.error('Erro ao atualizar data da última correção AH:', updateError);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Lançamento de AH registrado e enviado ao webhook com sucesso!',
          tipo_pessoa: tipoTabela === 'funcionarios' ? 'funcionario' : 'aluno',
          webhookUrl: WEBHOOK_URL,
          payload: webhookPayload,
          response: {
            status: response.status,
            body: responseText,
            headers: Object.fromEntries([...response.headers]),
            executionTime: responseTime
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (webhookError) {
      if (webhookError.name === 'AbortError') {
        console.error('Timeout ao tentar enviar dados para o webhook');
        throw new Error('Timeout ao tentar enviar dados para o webhook após 10 segundos');
      }
      throw webhookError;
    }

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

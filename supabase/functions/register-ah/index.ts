
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const startTime = performance.now();
  console.log('Iniciando função register-ah...');

  // Lidar com solicitações CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Processando requisição...');
    
    // Obter dados da solicitação
    const requestData = await req.json();
    const data = requestData.data;
    
    console.log('Dados recebidos:', JSON.stringify(data, null, 2));
    
    if (!data || !data.aluno_id) {
      console.error('Dados incompletos recebidos');
      return new Response(
        JSON.stringify({ error: 'Dados incompletos. ID do aluno é obrigatório.' }),
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

    // Buscar URL do webhook
    console.log('Buscando URL do webhook...');
    const { data: webhookConfig, error: webhookError } = await supabase
      .from('dados_importantes')
      .select('data')
      .eq('key', 'webhook_lancarha')
      .maybeSingle();

    if (webhookError) {
      console.error('Erro ao buscar webhook URL:', webhookError);
      throw new Error('Não foi possível recuperar a URL do webhook');
    }

    if (!webhookConfig?.data) {
      console.error('URL do webhook não encontrada na tabela dados_importantes');
      throw new Error('URL do webhook não encontrada');
    }

    const webhookUrl = webhookConfig.data;
    console.log('URL do webhook encontrada:', webhookUrl);

    // Registrar na tabela produtividade_ah
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

    // Buscar dados adicionais do aluno para enriquecer o payload
    console.log('Buscando dados do aluno...');
    const { data: alunoData, error: alunoError } = await supabase
      .from('alunos')
      .select('nome, turma_id, codigo, matricula')
      .eq('id', data.aluno_id)
      .single();

    if (alunoError) {
      console.error('Erro ao buscar dados do aluno:', alunoError);
      // Continuar mesmo com erro na busca de dados adicionais
    }

    // Preparar payload para o webhook
    const webhookPayload = {
      ...data,
      aluno_nome: alunoData?.nome,
      aluno_codigo: alunoData?.codigo,
      aluno_matricula: alunoData?.matricula,
      turma_id: alunoData?.turma_id,
      data_registro: new Date().toISOString(),
      teste: "teste" // Novo campo para testar webhook
    };

    console.log('Payload a ser enviado para webhook:', JSON.stringify(webhookPayload, null, 2));

    // Enviar dados para o webhook com timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      console.log('Iniciando envio para webhook...');
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Supera-AH-Webhook',
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

      // Atualizar última correção AH do aluno
      const { error: updateError } = await supabase
        .from('alunos')
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
          webhookUrl,
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

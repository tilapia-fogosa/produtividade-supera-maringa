
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Lidar com solicitações CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Iniciando função de registro de Abrindo Horizontes...');
    
    // Obter dados da solicitação
    const requestData = await req.json();
    const data = requestData.data;
    
    console.log('Dados recebidos para AH:', JSON.stringify(data, null, 2));
    
    if (!data || !data.aluno_id) {
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

    // Etapa 1: Buscar URL do webhook
    console.log('Buscando URL do webhook para AH...');
    const { data: webhookConfig, error: webhookError } = await supabase
      .from('dados_importantes')
      .select('data')
      .eq('key', 'webhook_lancarha')
      .maybeSingle();

    if (webhookError) {
      console.error('Erro ao buscar webhook URL:', webhookError);
      throw new Error('Não foi possível recuperar a URL do webhook');
    }

    const webhookUrl = webhookConfig?.data;
    console.log('URL do webhook encontrada:', webhookUrl);

    // Etapa 2: Registrar na tabela produtividade_ah
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

    // Etapa 3: Atualizar a coluna ultima_correcao_ah na tabela de alunos
    console.log('Atualizando data da última correção AH do aluno...');
    const { error: alunoError } = await supabase
      .from('alunos')
      .update({ 
        ultima_correcao_ah: new Date().toISOString() 
      })
      .eq('id', data.aluno_id);

    if (alunoError) {
      console.error('Erro ao atualizar data da última correção AH:', alunoError);
      throw new Error('Erro ao atualizar data da última correção: ' + alunoError.message);
    }

    // Etapa 4: Buscar dados adicionais do aluno para enriquecer o payload do webhook
    console.log('Buscando dados adicionais do aluno...');
    const { data: alunoData, error: alunoFetchError } = await supabase
      .from('alunos')
      .select('nome, turma_id, codigo, matricula, curso')
      .eq('id', data.aluno_id)
      .maybeSingle();

    if (alunoFetchError) {
      console.error('Erro ao buscar dados do aluno:', alunoFetchError);
      // Continuar mesmo com erro na busca de dados adicionais
    }

    // Etapa 5: Enviar dados para o webhook
    try {
      if (webhookUrl) {
        console.log('Enviando dados para o webhook...');
        
        // Preparar payload enriquecido para o webhook
        const webhookPayload = {
          ...data,
          aluno_nome: alunoData?.nome,
          aluno_codigo: alunoData?.codigo,
          aluno_matricula: alunoData?.matricula,
          aluno_curso: alunoData?.curso,
          turma_id: alunoData?.turma_id,
          data_registro: new Date().toISOString(),
        };
        
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload)
        });

        if (!webhookResponse.ok) {
          const errorText = await webhookResponse.text();
          throw new Error(`Erro no webhook: ${errorText}`);
        }

        console.log('Dados enviados com sucesso para o webhook!');
      } else {
        console.warn('URL do webhook não encontrada ou vazia, ignorando etapa de webhook');
      }
    } catch (webhookError) {
      console.error('Erro ao processar webhook:', webhookError);
      
      // Não falhar a operação inteira, apenas retornar status de sucesso parcial
      return new Response(
        JSON.stringify({ 
          success: true, 
          webhookError: true,
          message: 'Dados salvos no banco, mas não foi possível sincronizar com o webhook: ' + webhookError.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Retornar resposta de sucesso
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Lançamento de Abrindo Horizontes registrado com sucesso!'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

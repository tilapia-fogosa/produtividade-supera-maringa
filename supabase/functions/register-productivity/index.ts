
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./cors.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { ProdutividadeData } from "./types.ts";
import { createSupabaseClient, registrarDadosAluno, registrarProdutividade } from "./database-service.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Iniciando função de registro de produtividade...');
    
    // Criar cliente Supabase para buscar configurações
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Buscar webhook URL
    console.log('Buscando URL do webhook...');
    const { data: configData, error: configError } = await supabase
      .from('dados_importantes')
      .select('data')
      .eq('key', 'webhook_lançarprodutividade')
      .single();
    
    if (configError) {
      console.error('Erro ao buscar webhook URL:', configError);
      throw new Error('Não foi possível recuperar a URL do webhook');
    }

    if (!configData || !configData.data) {
      throw new Error('URL do webhook não encontrada');
    }

    const webhookUrl = configData.data;

    // Obter os dados da solicitação
    const requestData = await req.json();
    const data = requestData.data;
    
    console.log('Dados recebidos:', JSON.stringify(data, null, 2));
    
    if (!data) {
      return new Response(
        JSON.stringify({ error: 'Dados de produtividade não fornecidos' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Criar um cliente Supabase com o contexto de autenticação do usuário logado
    const supabaseClient = createSupabaseClient(req.headers.get('Authorization')!);

    // Registrar dados do aluno no banco
    const sucessoBanco = await registrarDadosAluno(supabaseClient, data);
    
    if (!sucessoBanco) {
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar dados do aluno' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Registrar produtividade nas tabelas do banco
    const sucessoProdutividade = await registrarProdutividade(supabaseClient, data);
    
    if (!sucessoProdutividade) {
      return new Response(
        JSON.stringify({ error: 'Erro ao registrar produtividade' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    try {
      console.log('Iniciando envio para o webhook...');
      
      // Enviar dados para o webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao enviar dados para o webhook: ${errorText}`);
      }

      console.log('Dados enviados com sucesso para o webhook!');
      
    } catch (webhookError) {
      console.error('Erro ao processar webhook:', webhookError);
      
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
      JSON.stringify({ success: true, message: 'Produtividade registrada com sucesso!' }),
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

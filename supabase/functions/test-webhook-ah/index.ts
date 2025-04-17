
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Iniciando função de teste do webhook AH...');
    
    // Criar cliente Supabase para buscar configurações
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Buscar webhook URL
    console.log('Buscando URL do webhook AH...');
    const { data: configData, error: configError } = await supabase
      .from('dados_importantes')
      .select('data')
      .eq('key', 'webhook_lancarha')
      .maybeSingle();
    
    if (configError) {
      console.error('Erro ao buscar webhook URL:', configError);
      throw new Error('Não foi possível recuperar a URL do webhook');
    }

    if (!configData || !configData.data) {
      console.error('URL do webhook não encontrada na tabela dados_importantes');
      throw new Error('URL do webhook não encontrada');
    }

    const webhookUrl = configData.data;
    console.log('URL do webhook AH encontrada:', webhookUrl);

    // Dados de teste para enviar
    const testData = {
      aluno: "Teste Webhook AH",
      apostila: "AH 5",
      exercicios: 10,
      erros: 2,
      professor_correcao: "Teste Corretor",
      data_registro: new Date().toISOString()
    };

    console.log('Payload a ser enviada:', JSON.stringify(testData, null, 2));

    // Enviar dados para o webhook com timeout e retry
    console.log('Enviando dados para o webhook...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Supera-AH-Webhook-Test',
        },
        body: JSON.stringify(testData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      console.log('Status da resposta:', response.status);
      console.log('Headers da resposta:', JSON.stringify(Object.fromEntries([...response.headers]), null, 2));
      console.log('Corpo da resposta:', responseText);

      if (!response.ok) {
        throw new Error(`Erro ao enviar dados para o webhook: Status ${response.status} - ${responseText}`);
      }

      console.log('Dados enviados com sucesso para o webhook!');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Dados enviados para o webhook AH com sucesso!',
          webhookUrl,
          payload: testData,
          response: {
            status: response.status,
            body: responseText,
            headers: Object.fromEntries([...response.headers])
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        console.error('Timeout ao tentar enviar dados para o webhook');
        throw new Error('Timeout ao tentar enviar dados para o webhook após 10 segundos');
      }
      throw fetchError;
    }

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

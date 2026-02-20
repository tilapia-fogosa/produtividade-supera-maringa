
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Iniciando função de teste do webhook...');
    
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

    // Dados de teste para enviar
    const testData = {
      aluno: "Teste Webhook",
      turma: "Turma Teste",
      presenca: true,
      data: new Date().toISOString(),
      apostila: "Teste",
      pagina: "1",
      exercicios: "10",
      erros: "2",
      fezDesafio: true,
      comentario: "Teste via webhook"
    };

    // Enviar dados para o webhook
    console.log('Enviando dados para o webhook...');
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao enviar dados para o webhook: ${errorText}`);
    }

    console.log('Dados enviados com sucesso!');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Dados enviados para o webhook com sucesso!' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});


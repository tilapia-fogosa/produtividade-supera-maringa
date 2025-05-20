
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { Database } from "../_shared/database-types.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    
    // Buscar o token do Slack da tabela dados_importantes
    const { data: tokenData, error: tokenError } = await supabase
      .from('dados_importantes')
      .select('data')
      .eq('key', 'SLACK_BOT_TOKEN')
      .single();
    
    if (tokenError || !tokenData || !tokenData.data) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token do Slack não configurado na tabela dados_importantes' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    const slackToken = tokenData.data;

    if (!slackToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token do Slack não configurado.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Buscar ID do canal do Slack da tabela dados_importantes
    const { data: canalData, error: canalError } = await supabase
      .from('dados_importantes')
      .select('data')
      .eq('key', 'canal_alertas_falta')
      .single();
    
    if (canalError || !canalData || !canalData.data) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'ID do canal do Slack não configurado na tabela dados_importantes' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }
    
    const slackChannelId = canalData.data;
    console.log('ID do canal do Slack:', slackChannelId);
    
    // Criar payload para envio
    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: ":test_tube: Mensagem de Teste :test_tube:",
          emoji: true
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Esta é uma mensagem de teste do sistema de alertas de falta."
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Se você está vendo esta mensagem, o sistema de notificações está funcionando corretamente!"
        }
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `:alarm_clock: Enviado em ${new Date().toLocaleString('pt-BR')}`
          }
        ]
      }
    ];
    
    // Enviar para a API do Slack
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        'Authorization': `Bearer ${slackToken}`
      },
      body: JSON.stringify({
        channel: slackChannelId,
        blocks: blocks,
        text: "Mensagem de teste do sistema de alertas" // Fallback text
      })
    });
    
    const responseData = await response.json();
    
    if (!responseData.ok) {
      console.error(`Erro ao enviar mensagem para o Slack: ${responseData.error}`);
      return new Response(
        JSON.stringify({ success: false, error: responseData.error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Mensagem de teste enviada com sucesso para o Slack!" 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Erro ao enviar mensagem de teste para o Slack:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

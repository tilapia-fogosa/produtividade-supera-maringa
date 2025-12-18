import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Edge function para substituir variáveis dinâmicas nas mensagens
 * 
 * Variáveis suportadas:
 * - {nome} → Nome do cliente
 * - {telefone} → Telefone do cliente
 * - {email} → Email do cliente
 * - {primeiro_nome} → Primeiro nome do cliente
 * 
 * Recebe:
 * - message: mensagem com variáveis
 * - clientId: ID do cliente para buscar dados
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { message, clientId } = body;

    console.log('replace-message-variables: Recebendo requisição', {
      messageLength: message?.length,
      clientId,
    });

    if (!message) {
      return new Response(
        JSON.stringify({ processed: '', error: 'Mensagem não informada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se não tem variáveis, retorna a mensagem original
    if (!message.includes('{')) {
      console.log('replace-message-variables: Nenhuma variável encontrada');
      return new Response(
        JSON.stringify({ processed: message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se não tem clientId, não consegue buscar dados
    if (!clientId) {
      console.log('replace-message-variables: ClientId não informado, retornando mensagem original');
      return new Response(
        JSON.stringify({ processed: message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inicializa Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Busca dados do cliente
    console.log('replace-message-variables: Buscando dados do cliente:', clientId);
    
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('name, phone, email')
      .eq('id', clientId)
      .single();

    if (clientError) {
      console.error('replace-message-variables: Erro ao buscar cliente:', clientError);
      // Retorna mensagem original se não encontrar cliente
      return new Response(
        JSON.stringify({ processed: message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('replace-message-variables: Cliente encontrado:', {
      name: client?.name,
      hasPhone: !!client?.phone,
      hasEmail: !!client?.email,
    });

    // Substitui variáveis
    let processedMessage = message;

    if (client) {
      // {nome} → Nome completo
      if (client.name) {
        processedMessage = processedMessage.replace(/{nome}/gi, client.name);
      }

      // {primeiro_nome} → Primeiro nome
      if (client.name) {
        const firstName = client.name.split(' ')[0];
        processedMessage = processedMessage.replace(/{primeiro_nome}/gi, firstName);
      }

      // {telefone} → Telefone
      if (client.phone) {
        processedMessage = processedMessage.replace(/{telefone}/gi, client.phone);
      }

      // {email} → Email
      if (client.email) {
        processedMessage = processedMessage.replace(/{email}/gi, client.email);
      }
    }

    console.log('replace-message-variables: Mensagem processada');

    return new Response(
      JSON.stringify({ processed: processedMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('replace-message-variables: Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Edge function para enviar mensagens WhatsApp
 * 
 * Recebe:
 * - destinatario: ID do grupo (@g.us) ou telefone
 * - phone_number: telefone (compatibilidade)
 * - mensagem: texto da mensagem (opcional)
 * - audio: base64 do áudio (opcional)
 * - imagem: base64 da imagem (opcional)
 * - video: base64 do vídeo (opcional)
 * - mime_type: tipo do arquivo (opcional)
 * - user_name: nome do usuário que envia
 * - client_id: ID do cliente (opcional)
 * - profile_id: ID do profile do usuário
 * - unit_id: ID da unidade (opcional)
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    console.log('send-whatsapp-message: Recebendo requisição', {
      hasDestinatario: !!body.destinatario,
      hasPhoneNumber: !!body.phone_number,
      hasMensagem: !!body.mensagem,
      hasAudio: !!body.audio,
      hasImagem: !!body.imagem,
      hasVideo: !!body.video,
      userName: body.user_name,
      clientId: body.client_id,
    });

    const {
      destinatario,
      phone_number,
      mensagem,
      audio,
      imagem,
      video,
      mime_type,
      user_name,
      client_id,
      profile_id,
      unit_id
    } = body;

    // Determina o destinatário final
    // Se destinatario estiver presente, usa ele, senão usa phone_number formatado
    let finalDestinatario = destinatario;
    
    if (!finalDestinatario && phone_number) {
      // Formata o telefone: remove caracteres não numéricos
      const cleanPhone = phone_number.replace(/\D/g, '');
      // Adiciona 55 se não tiver código do país
      finalDestinatario = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    }

    if (!finalDestinatario) {
      console.error('send-whatsapp-message: Destinatário não informado');
      return new Response(
        JSON.stringify({ error: 'Destinatário ou telefone é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verifica se tem pelo menos um conteúdo para enviar
    if (!mensagem && !audio && !imagem && !video) {
      console.error('send-whatsapp-message: Nenhum conteúdo para enviar');
      return new Response(
        JSON.stringify({ error: 'É necessário informar mensagem, áudio, imagem ou vídeo' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Busca URL do webhook no secret
    const webhookUrl = Deno.env.get('WHATSAPP_WEBHOOK_URL');
    
    if (!webhookUrl) {
      console.error('send-whatsapp-message: WHATSAPP_WEBHOOK_URL não configurado');
      return new Response(
        JSON.stringify({ error: 'Webhook não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Monta payload para o webhook
    const payload: Record<string, any> = {
      destinatario: finalDestinatario,
    };

    if (mensagem) payload.mensagem = mensagem;
    if (audio) payload.audio = audio;
    if (imagem) payload.imagem = imagem;
    if (video) payload.video = video;
    if (mime_type) payload.mime_type = mime_type;

    console.log('send-whatsapp-message: Enviando para webhook', {
      destinatario: finalDestinatario,
      hasMensagem: !!mensagem,
      hasAudio: !!audio,
      hasImagem: !!imagem,
      hasVideo: !!video,
    });

    // Envia para o webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error('send-whatsapp-message: Erro no webhook:', errorText);
      return new Response(
        JSON.stringify({ error: 'Erro ao enviar mensagem', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const webhookResult = await webhookResponse.json();
    console.log('send-whatsapp-message: Resposta do webhook:', webhookResult);

    // Salva no histórico comercial se for mensagem individual (não grupo) e tiver client_id
    const isGroup = finalDestinatario.includes('@g.us');
    
    if (!isGroup && client_id && mensagem) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log('send-whatsapp-message: Salvando no histórico comercial');

        await supabase.from('historico_comercial').insert({
          client_id,
          tipo_acao: 'MENSAGEM_WHATSAPP',
          descricao: mensagem.substring(0, 500),
          profile_id,
          unit_id: unit_id || null,
        });

        console.log('send-whatsapp-message: Histórico salvo com sucesso');
      } catch (histError) {
        console.error('send-whatsapp-message: Erro ao salvar histórico:', histError);
        // Não falha a requisição por erro no histórico
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Mensagem enviada com sucesso',
        webhook_response: webhookResult 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('send-whatsapp-message: Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

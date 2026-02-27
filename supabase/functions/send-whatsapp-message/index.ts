import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

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
      unit_id,
      quoted_message_id
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

    // Determinar o tipo de mensagem para o webhook global
    let tipoMensagem = 'text';
    if (audio) tipoMensagem = 'audio';
    else if (imagem) tipoMensagem = 'image';
    else if (video) tipoMensagem = 'video';
    payload.tipo = tipoMensagem;

    console.log('send-whatsapp-message: Enviando para webhook', {
      destinatario: finalDestinatario,
      hasMensagem: !!mensagem,
      hasAudio: !!audio,
      hasImagem: !!imagem,
      hasVideo: !!video,
      tipo: tipoMensagem,
    });

    // === FIRE-AND-FORGET: Envia para o webhook SEM esperar resposta ===
    // Isso elimina o delay de 2-4s que o webhook externo causava
    fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).then(async (res) => {
      if (!res.ok) {
        const errorText = await res.text();
        console.error('send-whatsapp-message: Erro no webhook (background):', errorText);
      } else {
        console.log('send-whatsapp-message: Webhook respondeu com sucesso (background)');
      }
    }).catch((err) => {
      console.error('send-whatsapp-message: Erro na chamada do webhook (background):', err);
    });

    // Salva no histórico comercial se for mensagem individual (não grupo) e tiver client_id
    const isGroup = finalDestinatario.includes('@g.us');

    if (!isGroup && (mensagem || audio || imagem || video)) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Validar se client_id é um UUID válido, senão usar null
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const validClientId = client_id && uuidRegex.test(client_id) ? client_id : null;

        let finalMediaUrl = null;
        let finalTipoMensagem = 'text';

        // Helper function to upload base64 to storage
        const uploadMedia = async (base64Str: string, defaultMime: string, type: string) => {
          try {
            // Some base64 strings come with data:image/png;base64, prefix
            const b64Data = base64Str.includes(',') ? base64Str.split(',')[1] : base64Str;
            const fileData = decode(b64Data);
            const ext = defaultMime.split('/')[1] || 'bin';
            const fileName = `${client_id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

            // Assume bucket name is 'whatsapp-media'
            const { data: uploadData, error: uploadError } = await supabase
              .storage
              .from('wpp_comercial')
              .upload(fileName, fileData, {
                contentType: (mime_type || defaultMime).split(';')[0].trim(),
                upsert: false
              });

            if (uploadError) {
              console.error(`send-whatsapp-message: Erro no upload de ${type}:`, uploadError);
              return null;
            }

            const { data: publicUrlData } = supabase.storage.from('wpp_comercial').getPublicUrl(fileName);
            return publicUrlData.publicUrl;
          } catch (e) {
            console.error(`send-whatsapp-message: Erro convertendo/upando ${type}:`, e);
            return null;
          }
        };

        if (audio) {
          finalMediaUrl = await uploadMedia(audio, mime_type || 'audio/ogg', 'audio');
          finalTipoMensagem = 'audioMessage';
        } else if (imagem) {
          finalMediaUrl = await uploadMedia(imagem, mime_type || 'image/jpeg', 'imagem');
          finalTipoMensagem = 'imageMessage';
        } else if (video) {
          finalMediaUrl = await uploadMedia(video, mime_type || 'video/mp4', 'video');
          finalTipoMensagem = 'videoMessage';
        }

        console.log('send-whatsapp-message: Salvando no histórico comercial, media:', finalMediaUrl);

        const { error: insertError } = await supabase.from('historico_comercial').insert({
          client_id: validClientId,
          telefone: finalDestinatario,
          mensagem: mensagem || null,
          tipo_mensagem: finalTipoMensagem,
          media_url: finalMediaUrl,
          created_by: profile_id,
          ...(unit_id ? { unit_id } : {}),
          ...(quoted_message_id ? { quoted_message_id } : {}),
          from_me: true
        });

        if (insertError) {
          console.error('send-whatsapp-message: Erro no insert do histórico:', insertError);
        }

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

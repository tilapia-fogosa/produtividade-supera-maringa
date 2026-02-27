import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Edge function para reagir/responder a mensagens WhatsApp
 * 
 * Recebe:
 * - historico_comercial_id: ID da mensagem original
 * - tipo: 'reacao' ou 'resposta'
 * - emoji: emoji da reação (quando tipo=reacao)
 * - mensagem_resposta: texto da resposta (quando tipo=resposta)
 * - profile_id: ID do profile do usuário
 * - profile_name: nome do usuário
 * - phone_number: telefone do destinatário (para enviar ao webhook)
 * 
 * Etapas:
 * 1. Salva na tabela whatsapp_message_reactions
 * 2. Envia para o webhook n8n (fire-and-forget)
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { historico_comercial_id, tipo, emoji, mensagem_resposta, profile_id, profile_name, phone_number } = await req.json();

    if (!historico_comercial_id || !tipo) {
      return new Response(
        JSON.stringify({ error: "historico_comercial_id e tipo são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Salvar na tabela de reações
    const { data, error } = await supabase
      .from("whatsapp_message_reactions")
      .insert({
        historico_comercial_id,
        tipo,
        emoji: emoji || null,
        mensagem_resposta: mensagem_resposta || null,
        profile_id: profile_id || null,
        profile_name: profile_name || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao inserir reação:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Reação inserida com sucesso:", data.id);

    // 2. Enviar para o webhook n8n (fire-and-forget)
    const webhookUrl = "https://webhookn8n.agenciakadin.com.br/webhook/mensagem_wpp_global";

    const webhookPayload: Record<string, any> = {
      destinatario: phone_number || null,
      historico_comercial_id,
      user_name: profile_name,
    };

    if (tipo === "reacao") {
      webhookPayload.tipo = "reaction";
      webhookPayload.emoji = emoji;
    } else if (tipo === "resposta") {
      webhookPayload.tipo = "answer";
      webhookPayload.mensagem = mensagem_resposta;
    }

    console.log("Enviando para webhook n8n:", JSON.stringify(webhookPayload));

    fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookPayload),
    }).then(async (res) => {
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Erro no webhook n8n (background):", errorText);
      } else {
        console.log("Webhook n8n respondeu com sucesso (background)");
      }
    }).catch((err) => {
      console.error("Erro na chamada do webhook n8n (background):", err);
    });

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Erro no react-whatsapp-message:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { historico_comercial_id, tipo, emoji, mensagem_resposta, profile_id, profile_name } = await req.json();

    if (!historico_comercial_id || !tipo) {
      return new Response(
        JSON.stringify({ error: "historico_comercial_id e tipo são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

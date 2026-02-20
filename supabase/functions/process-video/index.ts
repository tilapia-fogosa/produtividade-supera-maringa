
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase URL or Service Role Key not found");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    const { videoId, videoPath } = body;

    console.log(`Processing video ID: ${videoId}, path: ${videoPath}`);

    // Simular o processamento HLS (em um ambiente real, chamaria um serviço externo ou FFmpeg)
    // Atualizar o registro para mostrar que está em processamento
    const { error: updateError } = await supabase
      .from("videos")
      .update({ status: "processing" })
      .eq("id", videoId);

    if (updateError) {
      throw new Error(`Error updating video status: ${updateError.message}`);
    }

    // Simulação do tempo de processamento (5 segundos)
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Em um ambiente real, o serviço de conversão HLS geraria os segmentos e playlist
    // e atualizaria o URL. Aqui, vamos apenas simular isso.
    const hlsUrl = `${supabaseUrl}/storage/v1/object/public/videos/hls/${videoId}/playlist.m3u8`;
    
    // Atualizar o registro com o URL HLS e marcar como pronto
    const { error: finalUpdateError } = await supabase
      .from("videos")
      .update({ 
        status: "ready", 
        hls_url: hlsUrl,
        // Em um cenário real, duração e thumbnail seriam extraídos do vídeo processado
        duration: 180, // 3 minutos (simulado)
        thumbnail_url: `${supabaseUrl}/storage/v1/object/public/videos/thumbnails/${videoId}.jpg`
      })
      .eq("id", videoId);

    if (finalUpdateError) {
      throw new Error(`Error finalizing video: ${finalUpdateError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Video processed successfully",
        videoId,
        hlsUrl 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error processing video:", error.message);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

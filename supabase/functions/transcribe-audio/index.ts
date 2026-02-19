import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY secret is not configured');
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return new Response(JSON.stringify({ error: 'No audio file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Audio file size:', audioFile.size);

    if (audioFile.size < 1000) {
      console.log('Audio file too small, rejecting:', audioFile.size);
      return new Response(JSON.stringify({ error: 'Audio too short or empty' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const whisperFormData = new FormData();
    whisperFormData.append('file', audioFile, 'audio.webm');
    whisperFormData.append('model', 'whisper-1');
    whisperFormData.append('language', 'pt');
    whisperFormData.append('prompt', 'Transcrição de anotações sobre alunos, avaliações e observações pedagógicas em português brasileiro.');
    whisperFormData.append('temperature', '0');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: whisperFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Whisper API error:', response.status, errorText);
      return new Response(JSON.stringify({ error: `Whisper API error: ${response.status}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await response.json();

    // Filtro anti-alucinação: rejeitar textos conhecidos do Whisper
    const hallucinations = [
      'legendas pela comunidade amara.org',
      'amara.org',
      'inscreva-se',
      'obrigado por assistir',
      'thanks for watching',
      'subtitles by the amara.org community',
      'subscribe',
      'thank you for watching',
    ];

    const textLower = (result.text || '').toLowerCase().trim();
    const isHallucination = hallucinations.some(h => textLower.includes(h)) || textLower.length < 3;

    if (isHallucination) {
      console.log('Hallucination detected, rejecting:', result.text);
      return new Response(JSON.stringify({ error: 'Transcrição inválida - tente gravar novamente com mais clareza' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Transcription result:', result.text);

    return new Response(JSON.stringify({ text: result.text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

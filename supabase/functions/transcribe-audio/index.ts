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

    console.log('Audio file size:', audioFile.size, 'type:', audioFile.type);

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
    whisperFormData.append('response_format', 'verbose_json');
    whisperFormData.append('prompt', 'Anotação de voz sobre aluno. Observações pedagógicas e comerciais em português brasileiro.');
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
    console.log('Whisper result:', JSON.stringify({
      text: result.text,
      duration: result.duration,
      segments: result.segments?.map((s: any) => ({
        text: s.text,
        no_speech_prob: s.no_speech_prob,
        avg_logprob: s.avg_logprob,
      })),
    }));

    // Filtrar segmentos com alta probabilidade de "no speech"
    const validSegments = (result.segments || []).filter((s: any) => {
      const noSpeech = s.no_speech_prob || 0;
      const avgLogprob = s.avg_logprob || 0;
      // Rejeitar segmentos com alta prob de silêncio OU baixa confiança
      return noSpeech < 0.7 && avgLogprob > -1.5;
    });

    const filteredText = validSegments.map((s: any) => s.text).join('').trim();

    // Filtro anti-alucinação em textos conhecidos
    const hallucinations = [
      'legendas pela comunidade amara.org',
      'amara.org',
      'inscreva-se',
      'obrigado por assistir',
      'thanks for watching',
      'subtitles by the amara.org community',
      'subscribe',
      'thank you for watching',
      'puxa',
    ];

    const textLower = filteredText.toLowerCase().trim();
    const isHallucination = hallucinations.some(h => textLower.includes(h)) || textLower.length < 3;

    if (isHallucination || !filteredText) {
      console.log('Hallucination or no valid speech detected. Original:', result.text, '| Filtered:', filteredText);
      return new Response(JSON.stringify({ 
        error: 'Não foi possível transcrever o áudio. Fale mais alto e mais perto do microfone.',
        debug_text: result.text 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Transcription result:', filteredText);

    return new Response(JSON.stringify({ text: filteredText }), {
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

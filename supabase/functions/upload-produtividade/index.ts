
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Receber os dados do CSV
    const { data: csvData } = await req.json();

    // Array para armazenar os registros processados
    const processedRecords = [];

    // Processar cada linha do CSV
    for (const record of csvData) {
      // Criar um objeto com os dados necessários
      const produtividadeRecord = {
        id: crypto.randomUUID(), // Gera um UUID único
        aluno_id: record.aluno_id || null,
        data_aula: record.data_aula,
        presente: record.presente === 'true',
        apostila: record.apostila || null,
        pagina: record.pagina ? String(record.pagina) : null,
        exercicios: record.exercicios ? parseInt(record.exercicios) : null,
        erros: record.erros ? parseInt(record.erros) : null,
        fez_desafio: record.fez_desafio === 'true',
        comentario: record.comentario || null,
        is_reposicao: record.is_reposicao === 'true',
        created_at: record.created_at || new Date().toISOString(),
        updated_at: record.updated_at || new Date().toISOString()
      };

      processedRecords.push(produtividadeRecord);
    }

    // Inserir os registros processados no banco de dados
    const { data, error } = await supabase
      .from('produtividade_abaco')
      .insert(processedRecords);

    if (error) throw error;

    // Retornar sucesso
    return new Response(JSON.stringify({
      success: true,
      message: `${processedRecords.length} registros importados com sucesso.`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao processar CSV:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

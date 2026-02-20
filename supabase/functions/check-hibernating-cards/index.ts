
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from "../_shared/cors.ts";

const INACTIVITY_DAYS = 14; // Cartões inativos por 14 dias ou mais

serve(async (req) => {
  // Tratamento de CORS para requisições preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('Iniciando verificação de cartões hibernando...');
    
    // Buscar cartões que não foram atualizados nos últimos 14 dias
    // e que não estão nas colunas "done" ou "hibernating"
    const { data: hibernatingCards, error: queryError } = await supabase
      .from('kanban_cards')
      .update({ 
        column_id: 'hibernating',
        updated_at: new Date().toISOString()
      })
      .lt('updated_at', new Date(Date.now() - (INACTIVITY_DAYS * 24 * 60 * 60 * 1000)).toISOString())
      .not('column_id', 'in', '(done,hibernating)')
      .select();
      
    if (queryError) {
      console.error('Erro ao processar cartões hibernando:', queryError);
      throw queryError;
    }
    
    const cardsCount = hibernatingCards?.length || 0;
    console.log(`${cardsCount} cartões foram movidos para hibernando`);
    
    // Registrar a última verificação
    const { error: logError } = await supabase
      .from('dados_importantes')
      .upsert({
        key: 'ultima_verificacao_hibernating',
        data: new Date().toISOString()
      }, {
        onConflict: 'key'
      });
      
    if (logError) {
      console.error('Erro ao registrar verificação:', logError);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${cardsCount} cartões foram movidos para hibernando`, 
        hibernatingCards 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error('Erro ao processar verificação de cartões hibernando:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

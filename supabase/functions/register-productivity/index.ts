
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./cors.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createSupabaseClient } from "./database-service.ts";
import { getAccessToken, enviarParaGoogleSheets, prepararDadosParaSheets } from "./sheets-service.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar se as credenciais do Google estão configuradas
    const credentialsJSON = Deno.env.get('GOOGLE_SERVICE_ACCOUNT');
    const spreadsheetId = Deno.env.get('GOOGLE_SPREADSHEET_ID');

    if (!credentialsJSON || !spreadsheetId) {
      console.error('Credenciais do Google não configuradas corretamente');
      return new Response(
        JSON.stringify({ 
          error: true,
          message: 'Credenciais do Google Sheets não configuradas'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      console.log('Iniciando processo de sincronização com Google Sheets...');
      
      let credentials;
      try {
        credentials = JSON.parse(credentialsJSON);
        console.log('Credenciais do Google parseadas com sucesso');
      } catch (parseError) {
        console.error('Erro ao analisar credenciais do Google:', parseError);
        throw new Error('Formato das credenciais do Google é inválido');
      }

      const accessToken = await getAccessToken(credentials);
      
      if (!accessToken) {
        throw new Error('Não foi possível obter o token de acesso do Google');
      }

      console.log('Token de acesso obtido com sucesso');

      // Dados de teste
      const testData = {
        teste: true,
        timestamp: new Date().toISOString()
      };
      
      const sheetData = prepararDadosParaSheets(testData);
      
      const sucessoSheets = await enviarParaGoogleSheets(accessToken, spreadsheetId, sheetData);
      
      if (!sucessoSheets) {
        throw new Error('Falha ao enviar dados para o Google Sheets');
      }
      
      console.log('Dados enviados com sucesso para o Google Sheets');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Teste realizado com sucesso!' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } catch (googleError) {
      console.error('Erro ao processar operação do Google Sheets:', googleError);
      throw googleError;
    }

  } catch (error) {
    console.error('Erro geral:', error);
    console.error('Stack trace:', error.stack || 'Sem stack trace disponível');
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

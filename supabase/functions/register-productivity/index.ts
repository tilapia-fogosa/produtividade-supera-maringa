
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./cors.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { ProdutividadeData } from "./types.ts";
import { createSupabaseClient, registrarDadosAluno } from "./database-service.ts";
import { getAccessToken, enviarParaGoogleSheets, prepararDadosParaSheets } from "./sheets-service.ts";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Obter os dados da solicitação
    const { data } = await req.json();
    
    if (!data) {
      return new Response(
        JSON.stringify({ error: 'Dados de produtividade não fornecidos' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Dados recebidos:', JSON.stringify(data, null, 2));

    // Criar um cliente Supabase com o contexto de autenticação do usuário logado
    const supabaseClient = createSupabaseClient(req.headers.get('Authorization')!);

    // Registrar dados do aluno no banco
    const sucessoBanco = await registrarDadosAluno(supabaseClient, data);
    
    if (!sucessoBanco) {
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar dados do aluno' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Verificar se as credenciais do Google estão configuradas
    const credentialsJSON = Deno.env.get('GOOGLE_SERVICE_ACCOUNT');
    const spreadsheetId = Deno.env.get('GOOGLE_SPREADSHEET_ID');

    // Debug: Log das credenciais (apenas indicar se existem, não mostrar o conteúdo completo)
    console.log('GOOGLE_SERVICE_ACCOUNT configurado:', credentialsJSON ? 'Sim' : 'Não');
    console.log('GOOGLE_SPREADSHEET_ID configurado:', spreadsheetId ? 'Sim' : 'Não');

    if (!credentialsJSON || !spreadsheetId) {
      console.error('Credenciais do Google não configuradas corretamente');
      return new Response(
        JSON.stringify({ 
          success: true, 
          googleSheetsError: true,
          message: 'Dados salvos no banco, mas credenciais do Google Sheets não configuradas'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      console.log('Iniciando processo de sincronização com Google Sheets...');
      
      // Verificar formato das credenciais
      let credentials;
      try {
        credentials = JSON.parse(credentialsJSON);
        console.log('Credenciais do Google parseadas com sucesso');
      } catch (parseError) {
        console.error('Erro ao analisar credenciais do Google:', parseError);
        throw new Error('Formato das credenciais do Google é inválido. Verifique se é um JSON válido.');
      }

      // Obter token de acesso
      const accessToken = await getAccessToken(credentials);
      
      if (!accessToken) {
        throw new Error('Não foi possível obter o token de acesso do Google');
      }

      console.log('Token de acesso obtido com sucesso');

      // Preparar os dados para o Google Sheets
      const sheetData = prepararDadosParaSheets(data);
      
      // Enviar dados para o Google Sheets
      const sucessoSheets = await enviarParaGoogleSheets(accessToken, spreadsheetId, sheetData);
      
      if (!sucessoSheets) {
        throw new Error('Falha ao enviar dados para o Google Sheets');
      }
      
      console.log('Dados enviados com sucesso para o Google Sheets');
      
    } catch (googleError) {
      console.error('Erro ao processar operação do Google Sheets:', googleError);
      console.error('Detalhes do erro:', googleError.stack || 'Sem stack trace disponível');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          googleSheetsError: true,
          message: 'Dados salvos no banco, mas não foi possível sincronizar com o Google Sheets: ' + googleError.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Retornar resposta de sucesso
    return new Response(
      JSON.stringify({ success: true, message: 'Produtividade registrada com sucesso!' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro geral:', error);
    console.error('Detalhes do erro:', error.stack || 'Sem stack trace disponível');
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

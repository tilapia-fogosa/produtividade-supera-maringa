
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./cors.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { ProdutividadeData } from "./types.ts";
import { createSupabaseClient, registrarDadosAluno } from "./database-service.ts";
import { getAccessToken, enviarParaGoogleSheets, prepararDadosParaSheets } from "./sheets-service.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase para buscar configurações
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Buscar configurações do Google Sheets
    const { data: configsData, error: configsError } = await supabase
      .from('dados_importantes')
      .select('key, data')
      .in('key', ['GOOGLE_SERVICE_ACCOUNT_JSON', 'GOOGLE_SPREADSHEET_ID']);
    
    if (configsError) {
      console.error('Erro ao buscar configurações:', configsError);
      throw new Error('Não foi possível recuperar as configurações do Google Sheets');
    }

    // Converter array de configurações em objeto
    const configs = configsData.reduce((acc, item) => {
      acc[item.key] = item.data;
      return acc;
    }, {});

    const credentialsJSON = configs['GOOGLE_SERVICE_ACCOUNT_JSON'];
    const spreadsheetId = configs['GOOGLE_SPREADSHEET_ID'];

    console.log('Configurações carregadas:');
    console.log('GOOGLE_SERVICE_ACCOUNT_JSON:', credentialsJSON ? 'Configurado' : 'Não configurado');
    console.log('GOOGLE_SPREADSHEET_ID:', spreadsheetId ? 'Configurado' : 'Não configurado');

    // Obter os dados da solicitação
    const { data } = await req.json();
    
    if (!data) {
      return new Response(
        JSON.stringify({ error: 'Dados de produtividade não fornecidos' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

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
        throw new Error('Formato das credenciais do Google é inválido.');
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
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});


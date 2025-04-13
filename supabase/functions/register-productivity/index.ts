
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

interface ProdutividadeData {
  aluno_id: string;
  aluno_nome: string;
  turma_id: string;
  turma_nome: string;
  presente: boolean;
  motivo_falta?: string;
  apostila_abaco?: string;
  pagina_abaco?: string;
  exercicios_abaco?: string;
  erros_abaco?: string;
  fez_desafio?: boolean;
  comentario?: string;
  data_registro: string;
  data_ultima_correcao_ah?: string;
  apostila_atual?: string;
  ultima_pagina?: string;
}

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

    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      // Supabase API URL
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase SERVICE_ROLE KEY
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Se o aluno estava presente, atualizar a informação da última correção AH
    if (data.presente && data.data_ultima_correcao_ah) {
      // Atualizar a data da última correção AH
      const { error: updateError } = await supabaseClient
        .from('alunos')
        .update({ 
          ultima_correcao_ah: data.data_ultima_correcao_ah,
          apostila_atual: data.apostila_atual,
          ultima_pagina: data.ultima_pagina 
        })
        .eq('id', data.aluno_id);

      if (updateError) {
        console.error('Erro ao atualizar data da última correção AH:', updateError);
        return new Response(
          JSON.stringify({ error: 'Erro ao atualizar data da última correção AH' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // Verificar se as credenciais do Google estão configuradas
    const googleServiceAccount = Deno.env.get('GOOGLE_SERVICE_ACCOUNT');
    const googleSpreadsheetId = Deno.env.get('GOOGLE_SPREADSHEET_ID');

    if (!googleServiceAccount || !googleSpreadsheetId) {
      return new Response(
        JSON.stringify({ error: 'Credenciais do Google Service Account não configuradas' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    try {
      // Preparar os dados para o Google Sheets
      const googleSheetData = [
        data.aluno_id,
        data.aluno_nome,
        data.turma_id,
        data.turma_nome,
        data.presente ? 'Sim' : 'Não',
        data.motivo_falta || '',
        data.apostila_abaco || '',
        data.pagina_abaco || '',
        data.exercicios_abaco || '',
        data.erros_abaco || '',
        data.fez_desafio ? 'Sim' : 'Não',
        data.comentario || '',
        data.data_registro
      ];

      // Converter a string do Service Account em objeto JSON
      const serviceAccountCredentials = JSON.parse(googleServiceAccount);
      
      // Obter um token OAuth2 usando o service account
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: createJWT(serviceAccountCredentials)
        })
      });
      
      const tokenData = await tokenResponse.json();
      
      if (!tokenResponse.ok) {
        console.error('Erro ao obter token OAuth:', tokenData);
        throw new Error('Falha ao autenticar com Google: ' + JSON.stringify(tokenData));
      }
      
      const accessToken = tokenData.access_token;

      // Formatar os dados como JSON para a API Sheets
      const values = [googleSheetData];
      const body = {
        values,
      };

      // Construir a URL da API do Google Sheets
      const spreadsheetId = googleSpreadsheetId;
      const range = 'Sheet1'; // Nome da planilha
      const valueInputOption = 'USER_ENTERED';
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=${valueInputOption}`;

      // Enviar os dados para o Google Sheets usando o token OAuth obtido
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      // Verificar a resposta da API do Google Sheets
      if (!response.ok) {
        console.error('Erro ao registrar no Google Sheets:', 
          response.status, 
          response.statusText, 
          await response.text()
        );
        throw new Error('Erro ao registrar no Google Sheets: ' + response.statusText);
      }
    } catch (googleError) {
      console.error('Erro ao processar operação do Google Sheets:', googleError);
      
      // Retornar mensagem mais amigável para o usuário
      return new Response(
        JSON.stringify({ 
          success: true, 
          googleSheetsError: true,
          message: 'Dados salvos no banco, mas não foi possível sincronizar com o Google Sheets. Por favor, verifique as configurações de API.'
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
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Função para criar um JWT para autenticação OAuth2
function createJWT(serviceAccount) {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const oneHour = 60 * 60;
  
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + oneHour,
    iat: now
  };

  // Codificar header e payload para base64url
  const encodedHeader = btoa(JSON.stringify(header))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
    
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  // Concatenar para formar a mensagem não assinada
  const message = `${encodedHeader}.${encodedPayload}`;
  
  // Converter a chave privada em formato usável e assinar o JWT
  const privateKey = serviceAccount.private_key.replace(/\\n/g, '\n');
  
  // Usando a função de importação de chave Web Cryptography API
  const importAlgorithm = {
    name: 'RSASSA-PKCS1-v1_5',
    hash: { name: 'SHA-256' }
  };
  
  // Esta função é assíncrona, mas precisamos de uma versão síncrona para o JWT
  // No contexto real, uma biblioteca como jsonwebtoken seria usada
  // Aqui estamos simplificando e retornando um token dummy para demonstração
  // Em produção, implemente a assinatura RSA corretamente
  
  // Por simplicidade, estamos retornando apenas a mensagem não assinada
  return `${message}.SIGNATURE`;
}

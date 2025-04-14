
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Iniciando função de teste do Google Sheets...');
    
    // Criar cliente Supabase para buscar configurações
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Buscar configurações do Google Sheets
    console.log('Buscando configurações do Google Sheets...');
    const { data: configsData, error: configsError } = await supabase
      .from('dados_importantes')
      .select('key, data')
      .in('key', ['GOOGLE_SERVICE_ACCOUNT_JSON', 'GOOGLE_SPREADSHEET_ID']);
    
    if (configsError) {
      console.error('Erro ao buscar configurações:', configsError);
      throw new Error('Não foi possível recuperar as configurações do Google Sheets');
    }

    if (!configsData || configsData.length === 0) {
      throw new Error('Configurações do Google Sheets não encontradas');
    }

    // Converter array de configurações em objeto
    const configs = configsData.reduce((acc, item) => {
      acc[item.key] = item.data;
      return acc;
    }, {});

    const credentialsJSON = configs['GOOGLE_SERVICE_ACCOUNT_JSON'];
    const spreadsheetId = configs['GOOGLE_SPREADSHEET_ID'];

    if (!credentialsJSON || !spreadsheetId) {
      throw new Error('Credenciais ou ID da planilha não encontrados');
    }

    // Verificar formato das credenciais
    let credentials;
    try {
      credentials = JSON.parse(credentialsJSON);
      console.log('Credenciais do Google parseadas com sucesso');
    } catch (parseError) {
      throw new Error('Formato das credenciais do Google é inválido');
    }

    // Obter token de acesso
    const tokenEndpoint = 'https://oauth2.googleapis.com/token';
    const scopes = ['https://www.googleapis.com/auth/spreadsheets'];
    
    function base64UrlEncode(obj: any) {
      const json = JSON.stringify(obj);
      const base64 = btoa(json);
      return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    const now = Math.floor(Date.now() / 1000);
    
    const jwtHeader = {
      alg: 'RS256',
      typ: 'JWT'
    };
    
    const jwtClaimSet = {
      iss: credentials.client_email,
      scope: scopes.join(' '),
      aud: tokenEndpoint,
      exp: now + 3600,
      iat: now
    };
    
    const encodedHeader = base64UrlEncode(jwtHeader);
    const encodedClaimSet = base64UrlEncode(jwtClaimSet);
    const signatureInput = `${encodedHeader}.${encodedClaimSet}`;
    
    // Garantir que a chave privada esteja no formato correto
    const privateKey = credentials.private_key.replace(/\\n/g, '\n');
    
    // Converter a chave privada para o formato PKCS8
    const keyData = new TextEncoder().encode(privateKey);
    const importedKey = await crypto.subtle.importKey(
      'pkcs8',
      keyData.buffer,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256'
      },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      importedKey,
      new TextEncoder().encode(signatureInput)
    );
    
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
    const encodedSignature = signatureBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
    const jwt = `${signatureInput}.${encodedSignature}`;
    
    console.log('Solicitando token de acesso...');
    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Falha ao obter token de acesso: ${errorText}`);
    }
    
    const tokenData = await tokenResponse.json();
    console.log('Token de acesso obtido com sucesso');

    // Atualizar célula B3 com "Hello World"
    const range = 'Teste!B3';
    const sheetsEndpoint = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`;
    
    console.log('Atualizando célula B3...');
    const updateResponse = await fetch(sheetsEndpoint, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [['Hello World']]
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Erro ao atualizar planilha: ${errorText}`);
    }

    console.log('Célula atualizada com sucesso!');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Célula B3 atualizada com "Hello World" com sucesso!' 
      }),
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



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
  is_reposicao?: boolean;
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

    console.log('Dados recebidos:', JSON.stringify(data, null, 2));

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
    const credentialsJSON = Deno.env.get('GOOGLE_SERVICE_ACCOUNT');
    const spreadsheetId = Deno.env.get('GOOGLE_SPREADSHEET_ID');

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
      // Preparar os dados para o Google Sheets
      const dataAtual = new Date().toLocaleString('pt-BR');
      const sheetData = [
        dataAtual,                           // Carimbo de data/hora
        data.aluno_nome,                     // Nome do Aluno
        data.data_registro.split('T')[0],    // Data
        data.apostila_abaco || '',           // Qual Apostila de Ábaco?
        data.pagina_abaco || '',             // Ábaco - Página
        data.exercicios_abaco || '',         // Ábaco - Exercícios Realizados
        data.erros_abaco || '',              // Ábaco - Nº de Erros
        data.fez_desafio ? 'Sim' : 'Não',    // Fez Desafio?
        data.comentario || '',               // Comentário, observação ou Situação
        data.presente ? 'Presente' : 'Faltoso', // Tipo de Situação
        data.is_reposicao ? 'Sim' : 'Não'    // É reposição?
      ];

      // Verificar formato das credenciais
      let credentials;
      try {
        credentials = JSON.parse(credentialsJSON);
        console.log('Credenciais do Google parseadas com sucesso');
      } catch (parseError) {
        console.error('Erro ao analisar credenciais do Google:', parseError);
        throw new Error('Formato das credenciais do Google é inválido. Verifique se é um JSON válido.');
      }

      // Função para obter token de acesso usando OAuth2
      async function getAccessToken(credentials) {
        console.log('Iniciando obtenção de token de acesso...');
        
        const tokenEndpoint = 'https://oauth2.googleapis.com/token';
        const scopes = ['https://www.googleapis.com/auth/spreadsheets'];
        
        const jwtHeader = {
          alg: 'RS256',
          typ: 'JWT'
        };
        
        const now = Math.floor(Date.now() / 1000);
        const jwtClaimSet = {
          iss: credentials.client_email,
          scope: scopes.join(' '),
          aud: tokenEndpoint,
          exp: now + 3600,
          iat: now
        };
        
        // Função para codificar objeto em base64url
        function base64UrlEncode(obj) {
          const json = JSON.stringify(obj);
          const base64 = btoa(json);
          return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        }
        
        // Formar a parte de cabeçalho e payload do JWT
        const encodedHeader = base64UrlEncode(jwtHeader);
        const encodedClaimSet = base64UrlEncode(jwtClaimSet);
        const signatureInput = `${encodedHeader}.${encodedClaimSet}`;
        
        // Usar a chave privada das credenciais para assinar
        const privateKey = credentials.private_key.replace(/\\n/g, '\n');
        
        // Importar a chave para WebCrypto
        const importedKey = await crypto.subtle.importKey(
          'pkcs8',
          new TextEncoder().encode(privateKey).buffer,
          {
            name: 'RSASSA-PKCS1-v1_5',
            hash: 'SHA-256'
          },
          false,
          ['sign']
        );
        
        // Assinar o JWT
        const signature = await crypto.subtle.sign(
          'RSASSA-PKCS1-v1_5',
          importedKey,
          new TextEncoder().encode(signatureInput)
        );
        
        // Converter a assinatura para base64url
        const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
        const encodedSignature = signatureBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        
        // Formar o JWT completo
        const jwt = `${signatureInput}.${encodedSignature}`;
        
        // Usar o JWT para solicitar um token de acesso
        const response = await fetch(tokenEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Erro na resposta do token OAuth:', errorText);
          throw new Error(`Falha ao obter token: ${response.status} - ${errorText}`);
        }
        
        const tokenData = await response.json();
        console.log('Token de acesso obtido com sucesso');
        return tokenData.access_token;
      }

      // Obter token de acesso
      const accessToken = await getAccessToken(credentials);
      
      if (!accessToken) {
        throw new Error('Não foi possível obter o token de acesso do Google');
      }

      // Enviar dados para o Google Sheets
      console.log('Enviando dados para o Google Sheets...');
      const sheetsEndpoint = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Respostas ao formulário 1:append?valueInputOption=USER_ENTERED`;
      
      const sheetsResponse = await fetch(sheetsEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [sheetData]
        })
      });
      
      if (!sheetsResponse.ok) {
        const errorText = await sheetsResponse.text();
        console.error('Erro ao enviar para Google Sheets:', errorText);
        throw new Error(`Erro ao registrar no Google Sheets: ${sheetsResponse.status} - ${errorText}`);
      }
      
      const responseData = await sheetsResponse.json();
      console.log('Dados registrados com sucesso no Google Sheets:', responseData);
      
    } catch (googleError) {
      console.error('Erro ao processar operação do Google Sheets:', googleError);
      console.error('Detalhes do erro:', googleError.stack || 'Sem stack trace disponível');
      
      // Retornar mensagem mais amigável para o usuário
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

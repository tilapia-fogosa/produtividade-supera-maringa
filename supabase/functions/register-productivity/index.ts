
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
      // Preparar os dados para o Google Sheets de acordo com os cabeçalhos corretos
      const dataAtual = new Date().toLocaleString('pt-BR');
      const googleSheetData = [
        dataAtual,                           // Carimbo de data/hora
        data.aluno_nome,                     // Nome do Aluno
        data.data_registro.split('T')[0],    // Data
        data.apostila_abaco || '',           // Qual Apostila de Ábaco?
        data.pagina_abaco || '',             // Ábaco - Página
        data.exercicios_abaco || '',         // Ábaco - Exercícios Realizados
        data.erros_abaco || '',              // Ábaco - Nº de Erros
        data.fez_desafio ? 'Sim' : 'Não',    // Fez Desafio?
        data.comentario || '',               // Comentário, observação ou Situação
        data.presente ? 'Presente' : 'Faltoso' // Tipo de Situação
      ];

      // Converter a string do Service Account JSON em objeto
      let serviceAccountCredentials;
      try {
        serviceAccountCredentials = JSON.parse(googleServiceAccount);
        console.log('Service Account parseda com sucesso.');
      } catch (parseError) {
        console.error('Erro ao analisar JSON do Service Account:', parseError);
        throw new Error('Formato inválido do Google Service Account. Certifique-se de que é um JSON válido.');
      }
      
      // Importar a biblioteca para assinatura criptográfica
      const importKey = async (serviceAccount) => {
        try {
          const privateKey = serviceAccount.private_key.replace(/\\n/g, "\n");
          
          // Importar a chave privada para uso com a API Web Crypto
          const cryptoKey = await crypto.subtle.importKey(
            "pkcs8",
            pemToArrayBuffer(privateKey),
            {
              name: "RSASSA-PKCS1-v1_5",
              hash: { name: "SHA-256" }
            },
            false,
            ["sign"]
          );
          
          console.log('Chave RSA importada com sucesso');
          return cryptoKey;
        } catch (error) {
          console.error('Erro ao importar chave privada:', error);
          throw error;
        }
      };
      
      // Função para converter PEM para ArrayBuffer
      const pemToArrayBuffer = (pem) => {
        // Remover cabeçalho e rodapé PEM e quebras de linha
        const base64 = pem
          .replace('-----BEGIN PRIVATE KEY-----', '')
          .replace('-----END PRIVATE KEY-----', '')
          .replace(/\n/g, '');
        
        // Decodificar Base64 para string binária
        const binaryString = atob(base64);
        
        // Converter string binária para ArrayBuffer
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        return bytes.buffer;
      };
      
      // Função para criar um JWT usando Web Crypto API
      const createJWT = async (serviceAccount) => {
        try {
          // Cabeçalho JWT
          const header = {
            alg: "RS256",
            typ: "JWT"
          };
          
          // Tempo atual em segundos
          const now = Math.floor(Date.now() / 1000);
          
          // Payload (claims)
          const payload = {
            iss: serviceAccount.client_email,
            scope: "https://www.googleapis.com/auth/spreadsheets",
            aud: "https://oauth2.googleapis.com/token",
            exp: now + 3600, // 1 hora
            iat: now
          };
          
          // Codificar cabeçalho e payload para base64url
          const encodeSegment = (segment) => {
            const str = JSON.stringify(segment);
            const base64 = btoa(str);
            return base64
              .replace(/\+/g, "-")
              .replace(/\//g, "_")
              .replace(/=+$/, "");
          };
          
          const encodedHeader = encodeSegment(header);
          const encodedPayload = encodeSegment(payload);
          
          // Concatenar para formar a parte não assinada do JWT
          const signingInput = `${encodedHeader}.${encodedPayload}`;
          
          // Importar a chave e assinar
          const key = await importKey(serviceAccount);
          
          // Converter a string de entrada para ArrayBuffer para assinatura
          const encoder = new TextEncoder();
          const data = encoder.encode(signingInput);
          
          // Assinar usando a chave RSA e o algoritmo SHA-256
          const signatureBuffer = await crypto.subtle.sign(
            { name: "RSASSA-PKCS1-v1_5" },
            key,
            data
          );
          
          // Converter a assinatura para base64url
          const signature = arrayBufferToBase64Url(signatureBuffer);
          
          // Formar o JWT completo
          const jwt = `${signingInput}.${signature}`;
          
          console.log('JWT gerado com sucesso');
          return jwt;
        } catch (error) {
          console.error('Erro ao criar JWT:', error);
          throw error;
        }
      };
      
      // Função para converter ArrayBuffer para string base64url
      const arrayBufferToBase64Url = (buffer) => {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        return base64
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");
      };
      
      // Gerar JWT para autenticação
      console.log('Iniciando geração do JWT...');
      const jwt = await createJWT(serviceAccountCredentials);
      console.log('JWT gerado e pronto para uso na autenticação');
      
      // Obter um token OAuth2 usando o JWT
      console.log('Solicitando token OAuth2...');
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt
        })
      });
      
      if (!tokenResponse.ok) {
        const tokenErrorData = await tokenResponse.text();
        console.error('Erro na resposta do token OAuth:', tokenErrorData);
        throw new Error(`Falha ao autenticar com Google: ${tokenErrorData}`);
      }
      
      const tokenData = await tokenResponse.json();
      console.log('Token OAuth2 obtido com sucesso');
      const accessToken = tokenData.access_token;
      
      if (!accessToken) {
        throw new Error('Token de acesso não recebido do Google');
      }

      // Formatar os dados como JSON para a API Sheets
      const values = [googleSheetData];
      const body = {
        values,
      };

      // Construir a URL da API do Google Sheets
      const spreadsheetId = googleSpreadsheetId;
      const range = 'Respostas ao formulário 1'; // Nome correto da planilha
      const valueInputOption = 'USER_ENTERED';
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=${valueInputOption}`;

      console.log('Enviando dados para o Google Sheets...');
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
        const errorText = await response.text();
        console.error('Erro ao registrar no Google Sheets:', 
          response.status, 
          response.statusText, 
          errorText
        );
        throw new Error(`Erro ao registrar no Google Sheets: ${response.status} - ${errorText}`);
      }
      
      const responseData = await response.json();
      console.log('Resposta do Google Sheets:', JSON.stringify(responseData));
      console.log('Dados registrados com sucesso no Google Sheets!');
      
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

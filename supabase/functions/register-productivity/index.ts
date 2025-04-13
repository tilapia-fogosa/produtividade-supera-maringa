
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
  lancou_ah?: boolean;
  apostila_ah?: string;
  exercicios_ah?: string;
  erros_ah?: string;
  professor_correcao?: string;
  data_registro: string;
  is_reposicao?: boolean;
  data_ultima_correcao_ah?: string;
}

// Constantes para a planilha
const GOOGLE_SHEET_ID = Deno.env.get("GOOGLE_SPREADSHEET_ID");
const GOOGLE_SHEET_NAME = "Produtividade"; // Nome da planilha onde os dados serão gravados

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { data } = await req.json() as { data: ProdutividadeData };
    
    if (!data.aluno_id || !data.turma_id) {
      return new Response(
        JSON.stringify({ error: "Dados incompletos" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("Processando dados de produtividade:", JSON.stringify(data, null, 2));

    // Verificar se as credenciais do Google Service Account estão configuradas
    const serviceAccountCredentials = Deno.env.get("GOOGLE_SERVICE_ACCOUNT");
    if (!serviceAccountCredentials) {
      console.error("Google Service Account credentials not found in environment variables");
      return new Response(
        JSON.stringify({ 
          error: "Configuração incompleta: credenciais do Google Service Account não encontradas",
          message: "Contate o administrador do sistema para configurar as credenciais da API do Google",
          details: "As credenciais do Google Service Account precisam ser configuradas como um segredo (secret) no Supabase"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Verificar se o ID da planilha está configurado
    if (!GOOGLE_SHEET_ID) {
      console.error("Google Sheet ID not found in environment variables");
      return new Response(
        JSON.stringify({ 
          error: "Configuração incompleta: ID da planilha do Google não encontrado",
          message: "Contate o administrador do sistema para configurar o ID da planilha do Google",
          details: "O ID da planilha precisa ser configurado como um segredo (secret) no Supabase"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log("Successfully retrieved Google Service Account credentials");
    
    let credentials;
    try {
      credentials = JSON.parse(serviceAccountCredentials);
      console.log("Successfully parsed credentials JSON");
    } catch (error) {
      console.error("Failed to parse Google Service Account credentials:", error);
      return new Response(
        JSON.stringify({ 
          error: "Erro de configuração: formato inválido das credenciais do Google",
          message: "O formato das credenciais do Google Service Account está inválido",
          details: "O valor configurado para GOOGLE_SERVICE_ACCOUNT não é um JSON válido"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    if (!credentials.client_email || !credentials.private_key) {
      console.error("Invalid Google Service Account credentials: missing required fields");
      return new Response(
        JSON.stringify({ 
          error: "Erro de configuração: credenciais do Google Service Account inválidas",
          message: "As credenciais do Google Service Account estão incompletas",
          details: "As credenciais devem incluir client_email e private_key"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    console.log("Attempting to get access token...");
    const token = await getAccessToken(credentials);
    console.log("Successfully obtained access token");
    
    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR');
    const formattedTime = now.toLocaleTimeString('pt-BR');
    const timestamp = `${formattedDate} ${formattedTime}`;
    
    const rowData = [
      timestamp,
      data.aluno_nome,
      formattedDate,
      data.presente ? (data.apostila_abaco || "") : "",
      data.presente ? (data.pagina_abaco || "") : "",
      data.presente ? (data.exercicios_abaco || "") : "",
      data.presente ? (data.erros_abaco || "") : "",
      data.presente ? (data.fez_desafio ? "Sim" : "Não") : "",
      data.presente ? (data.comentario || "") : "",
      data.presente ? (data.lancou_ah ? "Sim" : "Não") : "",
      data.presente && data.lancou_ah ? (data.apostila_ah || "") : "",
      data.presente && data.lancou_ah ? (data.exercicios_ah || "") : "",
      data.presente && data.lancou_ah ? (data.erros_ah || "") : "",
      data.presente && data.lancou_ah ? (data.professor_correcao || "") : "",
      data.is_reposicao ? "Sim" : "Não"
    ];

    console.log("Attempting to append data to Google Sheet...");
    console.log(`Sheet ID: ${GOOGLE_SHEET_ID}, Sheet Name: ${GOOGLE_SHEET_NAME}`);
    await appendRowToSheet(GOOGLE_SHEET_ID, GOOGLE_SHEET_NAME, rowData, token);
    console.log("Successfully appended data to sheet");

    // Atualizar data da última correção AH se aplicável
    if (data.data_ultima_correcao_ah) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        const { error: updateError } = await supabase
          .from('alunos')
          .update({ ultima_correcao_ah: data.data_ultima_correcao_ah })
          .eq('id', data.aluno_id);

        if (updateError) {
          console.error('Erro ao atualizar data da última correção AH:', updateError);
        }
      } else {
        console.log('Credenciais do Supabase não encontradas, pulando atualização do banco de dados');
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Produtividade registrada com sucesso" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error:", error.message, error.stack);
    
    const errorMessage = error.message || "";
    if (errorMessage.includes("token") || 
        errorMessage.includes("credential") || 
        errorMessage.includes("auth") || 
        errorMessage.includes("access_token")) {
      return new Response(
        JSON.stringify({ 
          error: "Erro nas credenciais do Google Service Account",
          message: "Houve um problema com as credenciais do Google. Contate o administrador."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

async function getAccessToken(credentials: any): Promise<string> {
  try {
    console.log("Starting getAccessToken process");
    const tokenUrl = "https://oauth2.googleapis.com/token";
    
    const jwtHeader = {
      alg: "RS256",
      typ: "JWT"
    };
    
    const now = Math.floor(Date.now() / 1000);
    const oneHour = 60 * 60;
    
    const jwtClaimSet = {
      iss: credentials.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + oneHour,
      iat: now,
    };
    
    const encoder = new TextEncoder();
    const header = btoa(JSON.stringify(jwtHeader));
    const payload = btoa(JSON.stringify(jwtClaimSet));
    const toSign = encoder.encode(`${header}.${payload}`);
    
    const privateKey = credentials.private_key.replace(/\\n/g, "\n");
    
    console.log("Importing private key for signing");
    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      pemToArrayBuffer(privateKey),
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      false,
      ["sign"]
    );
    
    console.log("Signing JWT");
    const signature = await crypto.subtle.sign(
      { name: "RSASSA-PKCS1-v1_5" },
      cryptoKey,
      toSign
    );
    
    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    
    const jwt = `${header}.${payload}.${signatureB64}`;
    
    console.log("Exchanging JWT for access token");
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("Failed to get access token:", JSON.stringify(data));
      throw new Error(`Failed to get access token: ${JSON.stringify(data)}`);
    }
    
    console.log("Successfully obtained access token");
    return data.access_token;
  } catch (error) {
    console.error("Error in getAccessToken:", error);
    throw error;
  }
}

async function appendRowToSheet(sheetId: string, sheetName: string, rowData: any[], accessToken: string): Promise<void> {
  try {
    console.log("Starting appendRowToSheet process");
    const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetName)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    
    console.log("Sending request to Google Sheets API");
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [rowData],
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("Failed to append data to sheet:", JSON.stringify(data));
      throw new Error(`Failed to append data to sheet: ${JSON.stringify(data)}`);
    }
    console.log("Successfully appended data to sheet:", JSON.stringify(data));
  } catch (error) {
    console.error("Error in appendRowToSheet:", error);
    throw error;
  }
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  try {
    console.log("Converting PEM to ArrayBuffer");
    const base64 = pem
      .replace("-----BEGIN PRIVATE KEY-----", "")
      .replace("-----END PRIVATE KEY-----", "")
      .replace(/\n/g, "");
    
    const binaryString = atob(base64);
    
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes.buffer;
  } catch (error) {
    console.error("Error in pemToArrayBuffer:", error);
    throw error;
  }
}

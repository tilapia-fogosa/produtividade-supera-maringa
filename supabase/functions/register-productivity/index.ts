
// register-productivity/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const GOOGLE_SHEET_ID = "1CfLqLbtTOx_yaXSxOOKHAgGoSxW0TmdIOUeg5usXlaU";
const GOOGLE_SHEET_NAME = "Respostas ao formulário 1"; // Updated sheet name

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
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Log data being processed
    console.log("Processando dados de produtividade:", JSON.stringify(data, null, 2));

    // Get Google Service Account credentials from Supabase secrets
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

    // Log successful retrieval of credentials
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
    
    // Check if credentials include all required fields
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
    
    // Get an access token for the Google Sheets API
    console.log("Attempting to get access token...");
    const token = await getAccessToken(credentials);
    console.log("Successfully obtained access token");
    
    // Format current date and time for the timestamp column
    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR'); // Format: DD/MM/YYYY
    const formattedTime = now.toLocaleTimeString('pt-BR'); // Format: HH:MM:SS
    const timestamp = `${formattedDate} ${formattedTime}`;
    
    // Format data for Google Sheets according to specified columns
    const rowData = [
      timestamp, // Carimbo de data/hora
      data.aluno_nome, // Nome do Aluno
      formattedDate, // Data
      data.presente ? (data.apostila_abaco || "") : "", // Qual Apostila de Ábaco?
      data.presente ? (data.pagina_abaco || "") : "", // Ábaco - Página
      data.presente ? (data.exercicios_abaco || "") : "", // Ábaco - Exercícios Realizados
      data.presente ? (data.erros_abaco || "") : "", // Ábaco - Nº de Erros
      data.presente ? (data.fez_desafio ? "Sim" : "Não") : "", // Fez Desafio?
      data.presente ? (data.comentario || "") : "", // Comentário, observação ou Situação
      data.presente ? (data.lancou_ah ? "Sim" : "Não") : "", // Lançar AH?
      data.presente && data.lancou_ah ? (data.apostila_ah || "") : "", // Qual Apostila AH?
      data.presente && data.lancou_ah ? (data.exercicios_ah || "") : "", // Abrindo Horizontes - Exercícios Realizados
      data.presente && data.lancou_ah ? (data.erros_ah || "") : "", // Abrindo Horizontes - Nº Erros
      data.presente && data.lancou_ah ? (data.professor_correcao || "") : "", // Selecione o Professor que Corrigiu a AH
      data.is_reposicao ? "Sim" : "Não" // Indica se é reposição de aula
    ];

    console.log("Attempting to append data to Google Sheet...");
    // Add the data to the sheet using the Sheets API
    await appendRowToSheet(GOOGLE_SHEET_ID, GOOGLE_SHEET_NAME, rowData, token);
    console.log("Successfully appended data to sheet");

    return new Response(
      JSON.stringify({ success: true, message: "Produtividade registrada com sucesso" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error:", error.message, error.stack);
    
    // Check if it's a credentials-related error
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

/**
 * Get an access token for the Google Sheets API using service account credentials
 */
async function getAccessToken(credentials: any): Promise<string> {
  try {
    console.log("Starting getAccessToken process");
    const tokenUrl = "https://oauth2.googleapis.com/token";
    
    // Create a JWT to authenticate with Google
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
    
    // Encode the JWT
    const encoder = new TextEncoder();
    const header = btoa(JSON.stringify(jwtHeader));
    const payload = btoa(JSON.stringify(jwtClaimSet));
    const toSign = encoder.encode(`${header}.${payload}`);
    
    // Convert the private key to proper format
    const privateKey = credentials.private_key.replace(/\\n/g, "\n");
    
    console.log("Importing private key for signing");
    // Import the private key for signing
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
    // Sign the JWT
    const signature = await crypto.subtle.sign(
      { name: "RSASSA-PKCS1-v1_5" },
      cryptoKey,
      toSign
    );
    
    // Convert signature to base64
    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    
    // Create the complete JWT
    const jwt = `${header}.${payload}.${signatureB64}`;
    
    console.log("Exchanging JWT for access token");
    // Exchange the JWT for an access token
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

/**
 * Append a row of data to a Google Sheet
 */
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

/**
 * Convert PEM formatted private key to ArrayBuffer for crypto operations
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  try {
    console.log("Converting PEM to ArrayBuffer");
    // Remove header, footer, and newlines
    const base64 = pem
      .replace("-----BEGIN PRIVATE KEY-----", "")
      .replace("-----END PRIVATE KEY-----", "")
      .replace(/\n/g, "");
    
    // Convert base64 to binary
    const binaryString = atob(base64);
    
    // Convert binary to ArrayBuffer
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

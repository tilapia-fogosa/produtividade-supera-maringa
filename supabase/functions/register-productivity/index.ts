
// register-productivity/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { GoogleSpreadsheet } from "https://cdn.skypack.dev/google-spreadsheet@4.1.0?dts";
import { JWT } from "https://cdn.skypack.dev/google-auth-library@7.14.0?dts";

const GOOGLE_SHEET_ID = "Ueg5usXlaU";
const GOOGLE_SHEET_NAME = "Produtividade";

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

    // Get Google Service Account credentials from Supabase secrets
    const serviceAccountCredentials = Deno.env.get("GOOGLE_SERVICE_ACCOUNT");
    if (!serviceAccountCredentials) {
      throw new Error("Google Service Account credentials not found");
    }

    const credentials = JSON.parse(serviceAccountCredentials);
    const serviceAccountAuth = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    // Initialize the Google Sheet
    const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    
    // Get the sheet or create it if it doesn't exist
    let sheet = doc.sheetsByTitle[GOOGLE_SHEET_NAME];
    if (!sheet) {
      sheet = await doc.addSheet({ title: GOOGLE_SHEET_NAME });
    }

    // Format data for Google Sheets
    const rowData = {
      "Data": new Date().toISOString().split('T')[0],
      "Hora": new Date().toISOString().split('T')[1].split('.')[0],
      "ID Aluno": data.aluno_id,
      "Nome Aluno": data.aluno_nome,
      "ID Turma": data.turma_id,
      "Turma": data.turma_nome,
      "Presente": data.presente ? "Sim" : "Não",
      "Motivo Falta": data.motivo_falta || "",
      "Apostila Ábaco": data.apostila_abaco || "",
      "Página Ábaco": data.pagina_abaco || "",
      "Exercícios Realizados Ábaco": data.exercicios_abaco || "",
      "Número de Erros Ábaco": data.erros_abaco || "",
      "Fez Desafio": data.fez_desafio ? "Sim" : "Não",
      "Comentário": data.comentario || "",
      "Lançou AH": data.lancou_ah ? "Sim" : "Não",
      "Apostila AH": data.apostila_ah || "",
      "Exercícios Realizados AH": data.exercicios_ah || "",
      "Número de Erros AH": data.erros_ah || "",
      "Professor Correção": data.professor_correcao || "",
    };

    // Add the row to the sheet
    await sheet.addRow(rowData);

    return new Response(
      JSON.stringify({ success: true, message: "Produtividade registrada com sucesso" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error:", error.message);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

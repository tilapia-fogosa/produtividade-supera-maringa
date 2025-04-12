
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY') || '';
const SPREADSHEET_ID = Deno.env.get('GOOGLE_SPREADSHEET_ID') || '';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Iniciando sincronização com Google Sheets");
    
    // Validar se as variáveis de ambiente estão configuradas
    if (!GOOGLE_API_KEY) {
      throw new Error('Google API Key não configurada');
    }
    
    if (!SPREADSHEET_ID) {
      throw new Error('Google Spreadsheet ID não configurado');
    }
    
    console.log("Buscando dados da planilha...");
    
    // Fetch data from Google Sheets
    const sheetName = 'Alunos'; // Você pode tornar isso configurável via corpo da requisição
    const sheetsApiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}?key=${GOOGLE_API_KEY}`;
    console.log(`Acessando URL: ${sheetsApiUrl.replace(GOOGLE_API_KEY, 'API_KEY_HIDDEN')}`);
    
    const response = await fetch(sheetsApiUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro ao acessar Google Sheets: Status ${response.status} - ${errorText}`);
      throw new Error(`Falha ao buscar dados do Google Sheets: ${response.statusText}. 
        Verifique se: 
        1. A chave API tem permissão para acessar o Google Sheets API
        2. A planilha existe e está acessível
        3. O nome da planilha "Alunos" está correto`);
    }

    const data = await response.json();
    const rows = data.values || [];

    if (rows.length <= 1) {
      throw new Error('Nenhum dado encontrado na planilha ou apenas cabeçalhos presentes');
    }

    // Process spreadsheet data
    console.log(`Processando ${rows.length} linhas de dados...`);
    // Assuming first row contains headers: [Turma ID, Nome do Aluno]
    const headers = rows[0];
    const turmaIdIndex = headers.findIndex((h: string) => h.toLowerCase().includes('turma'));
    const nomeAlunoIndex = headers.findIndex((h: string) => h.toLowerCase().includes('nome'));

    if (turmaIdIndex === -1 || nomeAlunoIndex === -1) {
      throw new Error('Colunas obrigatórias não encontradas na planilha. É necessário ter colunas com "Turma" e "Nome" no cabeçalho.');
    }

    // Extract student data
    const students = rows.slice(1).map((row: string[]) => ({
      turma_id: row[turmaIdIndex],
      nome: row[nomeAlunoIndex],
    })).filter((student: { turma_id: string, nome: string }) => 
      student.turma_id && student.nome
    );

    console.log(`Extraídos ${students.length} alunos válidos da planilha`);

    // Sync with database
    // First, get existing students
    const { data: existingStudents, error: fetchError } = await supabase
      .from('alunos')
      .select('id, nome, turma_id');

    if (fetchError) {
      throw new Error(`Erro ao buscar alunos existentes: ${fetchError.message}`);
    }

    // Prepare batch operations
    const studentsToAdd = [];

    for (const student of students) {
      const exists = existingStudents.some(
        (existingStudent) => 
          existingStudent.nome.toLowerCase() === student.nome.toLowerCase() && 
          existingStudent.turma_id === student.turma_id
      );

      if (!exists) {
        studentsToAdd.push(student);
      }
    }

    console.log(`${studentsToAdd.length} novos alunos para adicionar`);

    // Insert new students
    let insertResult = null;
    if (studentsToAdd.length > 0) {
      const { data: insertData, error: insertError } = await supabase
        .from('alunos')
        .insert(studentsToAdd)
        .select();

      if (insertError) {
        throw new Error(`Erro ao inserir alunos: ${insertError.message}`);
      }
      insertResult = insertData;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sincronização concluída. Adicionados ${studentsToAdd.length} novos alunos.`,
        addedStudents: insertResult,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro:', error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    );
  }
});

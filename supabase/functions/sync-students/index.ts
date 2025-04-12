
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
    // Fetch data from Google Sheets
    const sheetName = 'Alunos'; // You can make this configurable via request body
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}?key=${GOOGLE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Google Sheets data: ${response.statusText}`);
    }

    const data = await response.json();
    const rows = data.values || [];

    if (rows.length <= 1) {
      throw new Error('No data found in spreadsheet or only headers present');
    }

    // Process spreadsheet data
    // Assuming first row contains headers: [Turma ID, Nome do Aluno]
    const headers = rows[0];
    const turmaIdIndex = headers.findIndex((h: string) => h.toLowerCase().includes('turma'));
    const nomeAlunoIndex = headers.findIndex((h: string) => h.toLowerCase().includes('nome'));

    if (turmaIdIndex === -1 || nomeAlunoIndex === -1) {
      throw new Error('Required columns not found in spreadsheet');
    }

    // Extract student data
    const students = rows.slice(1).map((row: string[]) => ({
      turma_id: row[turmaIdIndex],
      nome: row[nomeAlunoIndex],
    })).filter((student: { turma_id: string, nome: string }) => 
      student.turma_id && student.nome
    );

    // Sync with database
    // First, get existing students
    const { data: existingStudents, error: fetchError } = await supabase
      .from('alunos')
      .select('id, nome, turma_id');

    if (fetchError) {
      throw new Error(`Error fetching existing students: ${fetchError.message}`);
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

    // Insert new students
    let insertResult = null;
    if (studentsToAdd.length > 0) {
      const { data: insertData, error: insertError } = await supabase
        .from('alunos')
        .insert(studentsToAdd)
        .select();

      if (insertError) {
        throw new Error(`Error inserting students: ${insertError.message}`);
      }
      insertResult = insertData;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sync completed. Added ${studentsToAdd.length} new students.`,
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
    console.error('Error:', error.message);
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

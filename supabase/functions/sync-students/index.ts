import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY') || '';
const SPREADSHEET_ID = Deno.env.get('GOOGLE_SPREADSHEET_ID') || '';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Function to validate environment variables
function validateEnvironmentVars() {
  console.log("Validando variáveis de ambiente...");
  
  if (!GOOGLE_API_KEY) {
    throw new Error('Google API Key não configurada');
  }
  
  if (!SPREADSHEET_ID) {
    throw new Error('Google Spreadsheet ID não configurado');
  }

  console.log("Variáveis de ambiente validadas com sucesso");
}

// Function to fetch data from Google Sheets
async function fetchGoogleSheetsData() {
  console.log("Buscando dados da planilha...");
  
  const sheetName = 'SGS>Alunos'; 
  const sheetsApiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}?key=${GOOGLE_API_KEY}`;
  console.log(`Acessando URL: ${sheetsApiUrl.replace(GOOGLE_API_KEY, 'API_KEY_HIDDEN')}`);
  
  const response = await fetch(sheetsApiUrl);
  const responseText = await response.text();

  if (!response.ok) {
    console.error(`Erro ao acessar Google Sheets: Status ${response.status} - ${responseText}`);
    throw new Error(`Falha ao buscar dados do Google Sheets: ${response.statusText}. 
      Verifique se: 
      1. A chave API tem permissão para acessar o Google Sheets API
      2. A planilha existe e está acessível
      3. O nome da aba "SGS>Alunos" está correto
      4. A planilha está compartilhada como pública ou com o e-mail correto
      Resposta da API: ${responseText.substring(0, 200)}...`);
  }

  // Parse do texto para JSON
  let data;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    throw new Error(`Erro ao analisar resposta do Google Sheets: ${e.message}. Resposta recebida: ${responseText.substring(0, 200)}...`);
  }

  return data;
}

// Function to process headers and find column indexes
function processHeaders(headers: string[]) {
  console.log("Processando cabeçalhos:", headers);

  const columnIndexes = {
    nomeIndex: headers.findIndex((h: string) => h === 'Nome'),
    turmaIndex: headers.findIndex((h: string) => h === 'Turma atual'),
    professorIndex: headers.findIndex((h: string) => h === 'Professor'),
    indiceIndex: headers.findIndex((h: string) => h === 'Índice'),
    codigoIndex: headers.findIndex((h: string) => h === 'Código'),
    telefoneIndex: headers.findIndex((h: string) => h === 'Telefone'),
    emailIndex: headers.findIndex((h: string) => h === 'E-mail'),
    cursoIndex: headers.findIndex((h: string) => h === 'Curso'),
    matriculaIndex: headers.findIndex((h: string) => h === 'Matrícula'),
    idadeIndex: headers.findIndex((h: string) => h === 'Idade'),
    ultimoNivelIndex: headers.findIndex((h: string) => h === 'Último nível'),
    diasApostilaIndex: headers.findIndex((h: string) => h === 'Dias na apostila'),
    diasSuperaIndex: headers.findIndex((h: string) => h === 'Dias no Supera'),
    vencimentoContratoIndex: headers.findIndex((h: string) => h === 'Vencimento do contrato')
  };

  // Verificando se as colunas obrigatórias foram encontradas
  if (columnIndexes.nomeIndex === -1) {
    throw new Error('Coluna "Nome" não encontrada na planilha. É necessário ter uma coluna "Nome" no cabeçalho.');
  }
  
  if (columnIndexes.turmaIndex === -1) {
    throw new Error('Coluna "Turma atual" não encontrada na planilha. É necessário ter uma coluna "Turma atual" no cabeçalho.');
  }

  console.log(`Coluna Nome encontrada no índice ${columnIndexes.nomeIndex}`);
  console.log(`Coluna Turma atual encontrada no índice ${columnIndexes.turmaIndex}`);
  if (columnIndexes.professorIndex !== -1) {
    console.log(`Coluna Professor encontrada no índice ${columnIndexes.professorIndex}`);
  } else {
    console.log(`Coluna Professor não encontrada!`);
  }

  return columnIndexes;
}

// Function to extract data from rows with normalization
function extractDataFromRows(rows: string[][], headerRow: number, columnIndexes: any) {
  console.log(`Extraindo dados de ${rows.length - (headerRow + 1)} linhas...`);
  
  // Extract data from rows starting after the header row
  const rawData = rows.slice(headerRow + 1).map((row: string[]) => {
    // Creating an object with all available columns
    const rowData: Record<string, any> = {
      nome: row[columnIndexes.nomeIndex]?.trim() || '',
      turma_nome: row[columnIndexes.turmaIndex]?.trim() || '',
    };

    // Add professor if exists
    if (columnIndexes.professorIndex !== -1) {
      rowData.professor_nome = row[columnIndexes.professorIndex]?.trim() || '';
    }

    // Adding optional fields if they exist
    if (columnIndexes.indiceIndex !== -1) rowData.indice = row[columnIndexes.indiceIndex]?.trim() || '';
    if (columnIndexes.codigoIndex !== -1) rowData.codigo = row[columnIndexes.codigoIndex]?.trim() || '';
    if (columnIndexes.telefoneIndex !== -1) rowData.telefone = row[columnIndexes.telefoneIndex]?.trim() || '';
    if (columnIndexes.emailIndex !== -1) rowData.email = row[columnIndexes.emailIndex]?.trim() || '';
    if (columnIndexes.cursoIndex !== -1) rowData.curso = row[columnIndexes.cursoIndex]?.trim() || '';
    if (columnIndexes.matriculaIndex !== -1) rowData.matricula = row[columnIndexes.matriculaIndex]?.trim() || '';
    if (columnIndexes.idadeIndex !== -1) rowData.idade = row[columnIndexes.idadeIndex] ? parseInt(row[columnIndexes.idadeIndex]) : null;
    if (columnIndexes.ultimoNivelIndex !== -1) rowData.ultimo_nivel = row[columnIndexes.ultimoNivelIndex]?.trim() || '';
    if (columnIndexes.diasApostilaIndex !== -1) rowData.dias_apostila = row[columnIndexes.diasApostilaIndex] ? parseInt(row[columnIndexes.diasApostilaIndex]) : null;
    if (columnIndexes.diasSuperaIndex !== -1) rowData.dias_supera = row[columnIndexes.diasSuperaIndex] ? parseInt(row[columnIndexes.diasSuperaIndex]) : null;
    if (columnIndexes.vencimentoContratoIndex !== -1) rowData.vencimento_contrato = row[columnIndexes.vencimentoContratoIndex]?.trim() || '';

    return rowData;
  }).filter((data: Record<string, any>) => 
    data.nome && data.turma_nome  // Filtering only valid data with name and class
  );

  console.log(`Extraídos ${rawData.length} registros válidos da planilha`);
  return rawData;
}

// STEP 1: Extract unique professors from spreadsheet and sync to database
async function syncProfessors(rawData: Record<string, any>[]) {
  console.log("Sincronizando professores...");
  
  // Extract unique professors
  const uniqueProfessors = new Set<string>();
  
  rawData.forEach(row => {
    if (row.professor_nome && row.professor_nome.trim() !== '') {
      uniqueProfessors.add(row.professor_nome.trim());
    }
  });
  
  const professorsArray = Array.from(uniqueProfessors);
  console.log(`Encontrados ${professorsArray.length} professores únicos na planilha`);
  
  if (professorsArray.length === 0) {
    console.log("Nenhum professor encontrado na planilha para sincronizar");
    return [];
  }
  
  // Get existing professors from database
  const { data: existingProfessors, error: fetchError } = await supabase
    .from('professores')
    .select('id, nome');
  
  if (fetchError) {
    throw new Error(`Erro ao buscar professores existentes: ${fetchError.message}`);
  }
  
  // Find professors to add (not in database yet)
  const existingProfessorNames = new Set(existingProfessors.map(p => p.nome.toLowerCase().trim()));
  const professorsToAdd = professorsArray.filter(
    name => !existingProfessorNames.has(name.toLowerCase().trim())
  );
  
  console.log(`${professorsToAdd.length} novos professores para adicionar`);
  
  // Add new professors to database
  if (professorsToAdd.length > 0) {
    // Find a unidade_id to associate professors with (use default if available)
    const { data: unidades, error: unidadeError } = await supabase
      .from('unidades')
      .select('id')
      .limit(1);
    
    if (unidadeError) {
      throw new Error(`Erro ao buscar unidade padrão: ${unidadeError.message}`);
    }
    
    const defaultUnidadeId = unidades.length > 0 ? unidades[0].id : null;
    
    if (!defaultUnidadeId) {
      // If no unit exists, create a default one
      const { data: newUnidade, error: createUnidadeError } = await supabase
        .from('unidades')
        .insert({ nome: 'Unidade Padrão' })
        .select()
        .single();
        
      if (createUnidadeError) {
        throw new Error(`Erro ao criar unidade padrão: ${createUnidadeError.message}`);
      }
      
      console.log("Criada unidade padrão para associar professores");
      
      const unidadeId = newUnidade.id;
      
      // Insert the new professors
      const { data: insertedProfessors, error: insertError } = await supabase
        .from('professores')
        .insert(professorsToAdd.map(nome => ({ 
          nome, 
          unidade_id: unidadeId 
        })))
        .select();
      
      if (insertError) {
        throw new Error(`Erro ao inserir novos professores: ${insertError.message}`);
      }
      
      console.log(`${insertedProfessors.length} professores adicionados com sucesso`);
      
      // Return combined list of all professors
      return [...existingProfessors, ...insertedProfessors];
    } else {
      // Insert the new professors with existing unidade_id
      const { data: insertedProfessors, error: insertError } = await supabase
        .from('professores')
        .insert(professorsToAdd.map(nome => ({ 
          nome, 
          unidade_id: defaultUnidadeId 
        })))
        .select();
      
      if (insertError) {
        throw new Error(`Erro ao inserir novos professores: ${insertError.message}`);
      }
      
      console.log(`${insertedProfessors.length} professores adicionados com sucesso`);
      
      // Return combined list of all professors
      return [...existingProfessors, ...insertedProfessors];
    }
  }
  
  return existingProfessors;
}

// STEP 2: Extract unique turmas from spreadsheet and sync to database
async function syncTurmas(rawData: Record<string, any>[], professors: any[]) {
  console.log("Sincronizando turmas...");
  
  // Create a map of professor names to IDs for quick lookup
  const professorMap = new Map(
    professors.map(p => [p.nome.toLowerCase().trim(), p.id])
  );
  
  // Extract unique turmas with their professor associations
  const turmasMap = new Map<string, { nome: string, professor_nome: string | null }>();
  
  rawData.forEach(row => {
    if (row.turma_nome && row.turma_nome.trim() !== '') {
      const turmaNome = row.turma_nome.trim();
      const professorNome = row.professor_nome ? row.professor_nome.trim() : null;
      
      // Only add or update if we don't have this turma yet, or if we're adding professor info
      if (!turmasMap.has(turmaNome) || (!turmasMap.get(turmaNome)?.professor_nome && professorNome)) {
        turmasMap.set(turmaNome, { 
          nome: turmaNome, 
          professor_nome: professorNome 
        });
      }
    }
  });
  
  const turmasArray = Array.from(turmasMap.values());
  console.log(`Encontradas ${turmasArray.length} turmas únicas na planilha`);
  
  if (turmasArray.length === 0) {
    console.log("Nenhuma turma encontrada na planilha para sincronizar");
    return [];
  }
  
  // Get existing turmas from database
  const { data: existingTurmas, error: fetchError } = await supabase
    .from('turmas')
    .select('id, nome, professor_id, dia_semana, horario');
  
  if (fetchError) {
    throw new Error(`Erro ao buscar turmas existentes: ${fetchError.message}`);
  }
  
  // Map existing turmas by name for easy lookup
  const existingTurmasMap = new Map(
    existingTurmas.map(t => [t.nome.toLowerCase().trim(), t])
  );
  
  // Prepare turmas to add or update
  const turmasToAdd = [];
  const turmasToUpdate = [];
  
  for (const turma of turmasArray) {
    const existingTurma = existingTurmasMap.get(turma.nome.toLowerCase().trim());
    const professorId = turma.professor_nome ? 
      professorMap.get(turma.professor_nome.toLowerCase().trim()) : null;
    
    if (!existingTurma) {
      // New turma to add
      turmasToAdd.push({
        nome: turma.nome,
        professor_id: professorId,
        dia_semana: 'segunda', // Default values, can be updated later
        horario: '14:00:00'    // Default values, can be updated later
      });
    } else if (professorId && existingTurma.professor_id !== professorId) {
      // Existing turma with professor change
      turmasToUpdate.push({
        id: existingTurma.id,
        professor_id: professorId
      });
    }
  }
  
  console.log(`${turmasToAdd.length} novas turmas para adicionar`);
  console.log(`${turmasToUpdate.length} turmas para atualizar`);
  
  // Add new turmas
  if (turmasToAdd.length > 0) {
    const { data: insertedTurmas, error: insertError } = await supabase
      .from('turmas')
      .insert(turmasToAdd)
      .select();
    
    if (insertError) {
      throw new Error(`Erro ao inserir novas turmas: ${insertError.message}`);
    }
    
    console.log(`${insertedTurmas.length} turmas adicionadas com sucesso`);
  }
  
  // Update existing turmas
  for (const turma of turmasToUpdate) {
    const { error: updateError } = await supabase
      .from('turmas')
      .update({ professor_id: turma.professor_id })
      .eq('id', turma.id);
    
    if (updateError) {
      console.error(`Erro ao atualizar turma ${turma.id}: ${updateError.message}`);
    }
  }
  
  // Get updated list of all turmas
  const { data: allTurmas, error: allTurmasError } = await supabase
    .from('turmas')
    .select('id, nome, professor_id');
  
  if (allTurmasError) {
    throw new Error(`Erro ao buscar turmas atualizadas: ${allTurmasError.message}`);
  }
  
  return allTurmas;
}

// STEP 3: Sync students and link them to turmas
async function syncStudents(rawData: Record<string, any>[], turmas: any[]) {
  console.log("Sincronizando alunos...");
  
  // Create a map of turma names to IDs for quick lookup
  const turmaMap = new Map(
    turmas.map(t => [t.nome.toLowerCase().trim(), t.id])
  );
  
  // Prepare student data with turma_id
  const studentsData = rawData.map(row => {
    const turmaId = turmaMap.get(row.turma_nome.toLowerCase().trim());
    
    if (!turmaId) {
      console.warn(`Turma não encontrada para aluno ${row.nome}: ${row.turma_nome}`);
      return null;
    }
    
    return {
      nome: row.nome,
      turma_id: turmaId,
      codigo: row.codigo || null,
      telefone: row.telefone || null,
      email: row.email || null,
      curso: row.curso || null,
      matricula: row.matricula || null,
      idade: row.idade || null,
      ultimo_nivel: row.ultimo_nivel || null,
      dias_apostila: row.dias_apostila || null,
      dias_supera: row.dias_supera || null,
      vencimento_contrato: row.vencimento_contrato || null,
      indice: row.indice || null,
      active: true // Marcando todos os alunos da planilha como ativos
    };
  }).filter(Boolean);
  
  console.log(`Preparados ${studentsData.length} alunos para sincronização`);
  
  if (studentsData.length === 0) {
    console.log("Nenhum aluno válido encontrado para sincronizar");
    return [];
  }
  
  try {
    // Primeiro, marcar todos os alunos como inativos
    const { error: updateError } = await supabase
      .from('alunos')
      .update({ active: false })
      .eq('active', true);
      
    if (updateError) {
      throw new Error(`Erro ao marcar alunos como inativos: ${updateError.message}`);
    }
    
    console.log("Todos os alunos marcados como inativos temporariamente");
    
    // Agora, para cada aluno na planilha
    for (const studentData of studentsData) {
      // Verificar se o aluno já existe (por nome e turma)
      const { data: existingStudent, error: fetchError } = await supabase
        .from('alunos')
        .select('id')
        .eq('nome', studentData.nome)
        .eq('turma_id', studentData.turma_id)
        .maybeSingle();
        
      if (fetchError) {
        console.error(`Erro ao buscar aluno ${studentData.nome}:`, fetchError);
        continue;
      }
      
      if (existingStudent) {
        // Atualizar aluno existente
        const { error: updateError } = await supabase
          .from('alunos')
          .update({ ...studentData })
          .eq('id', existingStudent.id);
          
        if (updateError) {
          console.error(`Erro ao atualizar aluno ${studentData.nome}:`, updateError);
        }
      } else {
        // Inserir novo aluno
        const { error: insertError } = await supabase
          .from('alunos')
          .insert([studentData]);
          
        if (insertError) {
          console.error(`Erro ao inserir aluno ${studentData.nome}:`, insertError);
        }
      }
    }
    
    // Retornar os alunos ativos após a sincronização
    const { data: activeStudents, error: fetchActiveError } = await supabase
      .from('alunos')
      .select('*')
      .eq('active', true);
      
    if (fetchActiveError) {
      throw fetchActiveError;
    }
    
    return activeStudents || [];
  } catch (error) {
    console.error('Erro durante a sincronização de alunos:', error);
    throw error;
  }
}

// Main function to handle the full sync process
async function syncFromGoogleSheets() {
  try {
    console.log("Iniciando sincronização completa com Google Sheets");
    
    // Validate environment variables
    validateEnvironmentVars();
    
    // Fetch Google Sheets data
    const data = await fetchGoogleSheetsData();
    const rows = data.values || [];
    
    if (rows.length <= 5) {
      throw new Error('Nenhum dado encontrado na planilha ou apenas cabeçalhos presentes');
    }
    
    // The header is in row 5 (index 4)
    const headerRow = 4;
    console.log(`Processando ${rows.length} linhas de dados...`);
    
    // Process headers and find column indexes
    const columnIndexes = processHeaders(rows[headerRow]);
    
    // Extract raw data from rows
    const rawData = extractDataFromRows(rows, headerRow, columnIndexes);
    
    // STEP 1: Sync professors
    const professors = await syncProfessors(rawData);
    
    // STEP 2: Sync turmas and link to professors
    const turmas = await syncTurmas(rawData, professors);
    
    // STEP 3: Sync students and link to turmas
    const newStudents = await syncStudents(rawData, turmas);
    
    return {
      success: true,
      message: `Sincronização concluída com sucesso. Adicionados ${newStudents.length} novos alunos.`,
      statistics: {
        professores: professors.length,
        turmas: turmas.length,
        novosAlunos: newStudents.length,
        totalRegistrosProcessados: rawData.length
      }
    };
  } catch (error) {
    console.error('Erro durante o processo de sincronização:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Main request handler
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const result = await syncFromGoogleSheets();
    
    return new Response(
      JSON.stringify(result),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: result.success ? 200 : 500,
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

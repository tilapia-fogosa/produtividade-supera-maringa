
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

// Function to extract student data from rows
function extractStudents(rows: string[][], headerRow: number, columnIndexes: any) {
  // Extract student data começando da linha após o cabeçalho (linha 6, índice 5)
  const students = rows.slice(headerRow + 1).map((row: string[]) => {
    // Criando o objeto do aluno com todas as colunas disponíveis
    const student: Record<string, any> = {
      nome: row[columnIndexes.nomeIndex] || '',
      turma_nome: row[columnIndexes.turmaIndex] || '',
      professor_nome: row[columnIndexes.professorIndex] || '',
    };

    // Adicionando campos opcionais se existirem
    if (columnIndexes.indiceIndex !== -1) student.indice = row[columnIndexes.indiceIndex] || '';
    if (columnIndexes.codigoIndex !== -1) student.codigo = row[columnIndexes.codigoIndex] || '';
    if (columnIndexes.telefoneIndex !== -1) student.telefone = row[columnIndexes.telefoneIndex] || '';
    if (columnIndexes.emailIndex !== -1) student.email = row[columnIndexes.emailIndex] || '';
    if (columnIndexes.cursoIndex !== -1) student.curso = row[columnIndexes.cursoIndex] || '';
    if (columnIndexes.matriculaIndex !== -1) student.matricula = row[columnIndexes.matriculaIndex] || '';
    if (columnIndexes.idadeIndex !== -1) student.idade = row[columnIndexes.idadeIndex] ? parseInt(row[columnIndexes.idadeIndex]) : null;
    if (columnIndexes.ultimoNivelIndex !== -1) student.ultimo_nivel = row[columnIndexes.ultimoNivelIndex] || '';
    if (columnIndexes.diasApostilaIndex !== -1) student.dias_apostila = row[columnIndexes.diasApostilaIndex] ? parseInt(row[columnIndexes.diasApostilaIndex]) : null;
    if (columnIndexes.diasSuperaIndex !== -1) student.dias_supera = row[columnIndexes.diasSuperaIndex] ? parseInt(row[columnIndexes.diasSuperaIndex]) : null;
    if (columnIndexes.vencimentoContratoIndex !== -1) student.vencimento_contrato = row[columnIndexes.vencimentoContratoIndex] || '';

    return student;
  }).filter((student: Record<string, any>) => 
    student.nome && student.turma_nome  // Filtrando apenas alunos com nome e turma
  );

  console.log(`Extraídos ${students.length} alunos válidos da planilha`);
  return students;
}

// Function to fetch professors and turmas from the database
async function fetchProfessoresAndTurmas() {
  // Buscar professores e turmas para associar aos alunos
  const { data: professores, error: professorError } = await supabase
    .from('professores')
    .select('id, nome');

  if (professorError) {
    throw new Error(`Erro ao buscar professores: ${professorError.message}`);
  }

  const { data: turmas, error: turmasError } = await supabase
    .from('turmas')
    .select('id, nome, professor_id');

  if (turmasError) {
    throw new Error(`Erro ao buscar turmas: ${turmasError.message}`);
  }

  console.log(`Encontrados ${professores.length} professores e ${turmas.length} turmas no banco de dados`);

  // Log dos nomes de professores para depuração
  console.log("Professores no banco:", professores.map((p: any) => p.nome).join(', '));
  console.log("Turmas no banco:", turmas.map((t: any) => t.nome).join(', '));

  return { professores, turmas };
}

// Function to map professors and turmas to easier to access formats
function createLookupMaps(professores: any[], turmas: any[]) {
  // Mapear professores por nome para rápido acesso
  const professoresPorNome = professores.reduce((acc: Record<string, string>, prof: any) => {
    acc[prof.nome.toLowerCase().trim()] = prof.id;
    return acc;
  }, {});

  // Mapear turmas por nome e professor_id para rápido acesso
  const turmasPorNome = turmas.reduce((acc: Record<string, string>, turma: any) => {
    acc[`${turma.nome.toLowerCase().trim()}`] = turma.id;
    // Também adicionar mapeamento com nome da turma + professor_id
    if (turma.professor_id) {
      acc[`${turma.nome.toLowerCase().trim()}_${turma.professor_id}`] = turma.id;
    }
    return acc;
  }, {});

  return { professoresPorNome, turmasPorNome };
}

// Function to prepare students for insertion, mapping turmas and professors
function prepareStudentsForInsertion(students: any[], professoresPorNome: Record<string, string>, turmasPorNome: Record<string, string>, turmas: any[]) {
  const studentsToAdd = [];
  const turmasNaoEncontradas = new Set<string>();
  const professoresNaoEncontrados = new Set<string>();
  const nomesOcorrencias: Record<string, number> = {};

  for (const student of students) {
    // Normalizar os nomes para evitar problemas com espaços extras e capitalização
    if (student.professor_nome) {
      student.professor_nome = student.professor_nome.trim();
    }
    if (student.turma_nome) {
      student.turma_nome = student.turma_nome.trim();
    }
    
    // Contar ocorrências para diagnóstico
    if (student.turma_nome) {
      nomesOcorrencias[student.turma_nome] = (nomesOcorrencias[student.turma_nome] || 0) + 1;
    }

    // Processar apenas se tiver nome e turma
    if (student.nome && student.turma_nome) {
      const professorId = student.professor_nome ? 
        professoresPorNome[student.professor_nome.toLowerCase().trim()] : 
        null;

      // Se não encontramos o professor, registrar para reportar
      if (student.professor_nome && !professorId) {
        professoresNaoEncontrados.add(student.professor_nome);
      }

      // Tentar encontrar a turma pelo nome e professor
      let turmaId = findTurmaId(student.turma_nome, professorId, turmasPorNome, turmas);

      if (!turmaId) {
        turmasNaoEncontradas.add(student.turma_nome);
        continue; // Pular este aluno se não tiver turma correspondente
      }

      // Se encontramos uma turma, adicionar o aluno com todos os dados
      if (turmaId) {
        const alunoParaAdicionar: Record<string, any> = {
          nome: student.nome,
          turma_id: turmaId,
        };

        // Adicionar campos extras
        if (student.indice) alunoParaAdicionar.indice = student.indice;
        if (student.codigo) alunoParaAdicionar.codigo = student.codigo;
        if (student.telefone) alunoParaAdicionar.telefone = student.telefone;
        if (student.email) alunoParaAdicionar.email = student.email;
        if (student.curso) alunoParaAdicionar.curso = student.curso;
        if (student.matricula) alunoParaAdicionar.matricula = student.matricula;
        if (student.idade !== null) alunoParaAdicionar.idade = student.idade;
        if (student.ultimo_nivel) alunoParaAdicionar.ultimo_nivel = student.ultimo_nivel;
        if (student.dias_apostila !== null) alunoParaAdicionar.dias_apostila = student.dias_apostila;
        if (student.dias_supera !== null) alunoParaAdicionar.dias_supera = student.dias_supera;
        if (student.vencimento_contrato) alunoParaAdicionar.vencimento_contrato = student.vencimento_contrato;

        studentsToAdd.push(alunoParaAdicionar);
      }
    }
  }

  return { 
    studentsToAdd, 
    turmasNaoEncontradas: Array.from(turmasNaoEncontradas), 
    professoresNaoEncontrados: Array.from(professoresNaoEncontrados),
    nomesOcorrencias 
  };
}

// Helper function to find turma ID using different matching strategies
function findTurmaId(turmaNome: string, professorId: string | null, turmasPorNome: Record<string, string>, turmas: any[]) {
  const normalizedTurmaNome = turmaNome.toLowerCase().trim();
  
  // Primeiro tentamos pelo nome exato
  let turmaId = turmasPorNome[normalizedTurmaNome];
  
  // Se não encontrou e temos professor_id, tenta com a combinação
  if (!turmaId && professorId) {
    turmaId = turmasPorNome[`${normalizedTurmaNome}_${professorId}`];
  }

  // Se ainda não encontramos, tentamos buscar qualquer turma com um nome similar
  if (!turmaId) {
    // Buscar turmas com nomes parecidos (ignorando espaços extras e case)
    const turmaComNomeSimilar = turmas.find(t => 
      t.nome.toLowerCase().trim() === normalizedTurmaNome ||
      t.nome.toLowerCase().trim().replace(/\s+/g, '') === normalizedTurmaNome.replace(/\s+/g, '')
    );
    
    if (turmaComNomeSimilar) {
      turmaId = turmaComNomeSimilar.id;
      console.log(`Match aproximado encontrado: "${turmaNome}" -> "${turmaComNomeSimilar.nome}"`);
    }
  }

  return turmaId;
}

// Function to filter out students that already exist in the database
async function filterExistingStudents(studentsToAdd: any[]) {
  // Obter alunos existentes para evitar duplicatas
  const { data: existingStudents, error: fetchError } = await supabase
    .from('alunos')
    .select('id, nome, turma_id');

  if (fetchError) {
    throw new Error(`Erro ao buscar alunos existentes: ${fetchError.message}`);
  }

  // Filtrar alunos para adicionar apenas os que não existem ainda
  const alunosUnicos = studentsToAdd.filter(newStudent => {
    return !existingStudents.some(existingStudent => 
      existingStudent.nome.toLowerCase() === newStudent.nome.toLowerCase() && 
      existingStudent.turma_id === newStudent.turma_id
    );
  });

  console.log(`${alunosUnicos.length} alunos únicos para adicionar (depois de remover duplicatas)`);
  return alunosUnicos;
}

// Function to insert new students into the database
async function insertStudents(alunosUnicos: any[]) {
  if (alunosUnicos.length === 0) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from('alunos')
    .insert(alunosUnicos)
    .select();

  if (error) {
    console.error(`Erro ao inserir alunos: ${error.message}`);
    throw new Error(`Erro ao inserir alunos: ${error.message}`);
  }

  return { data, error };
}

// Main function to handle the sync process
async function syncStudents() {
  try {
    console.log("Iniciando sincronização com Google Sheets");
    
    // Validar variáveis de ambiente
    validateEnvironmentVars();
    
    // Fetch Google Sheets data
    const data = await fetchGoogleSheetsData();
    const rows = data.values || [];

    if (rows.length <= 5) {  // Verificando se temos pelo menos a linha de cabeçalho e um dado
      throw new Error('Nenhum dado encontrado na planilha ou apenas cabeçalhos presentes');
    }

    // O cabeçalho está na linha 5 (índice 4)
    const headerRow = 4;
    console.log(`Processando ${rows.length} linhas de dados...`);
    
    // Process headers and find column indexes
    const columnIndexes = processHeaders(rows[headerRow]);
    
    // Extract student data from rows
    const students = extractStudents(rows, headerRow, columnIndexes);
    
    // Fetch professors and turmas from database
    const { professores, turmas } = await fetchProfessoresAndTurmas();
    
    // Create lookup maps for professors and turmas
    const { professoresPorNome, turmasPorNome } = createLookupMaps(professores, turmas);
    
    // Prepare students for insertion, mapping turmas and professors
    const { studentsToAdd, turmasNaoEncontradas, professoresNaoEncontrados, nomesOcorrencias } = 
      prepareStudentsForInsertion(students, professoresPorNome, turmasPorNome, turmas);
    
    // Log diagnostic info
    logDiagnosticInfo(studentsToAdd, turmasNaoEncontradas, professoresNaoEncontrados, nomesOcorrencias);
    
    // Filter out students that already exist in the database
    const alunosUnicos = await filterExistingStudents(studentsToAdd);
    
    // Insert new students into the database
    const { data: insertResult } = await insertStudents(alunosUnicos);
    
    return {
      success: true,
      message: `Sincronização concluída. Adicionados ${alunosUnicos.length} novos alunos.`,
      addedStudents: insertResult,
      warnings: {
        turmasNaoEncontradas,
        professoresNaoEncontrados
      },
      diagnostico: {
        totalTurmasNaPlanilha: Object.keys(nomesOcorrencias).length,
        totalTurmasNoDB: turmas.length,
        totalProfessoresNoDB: professores.length
      }
    };
  } catch (error) {
    console.error('Erro durante a sincronização:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Helper function to log diagnostic information
function logDiagnosticInfo(studentsToAdd: any[], turmasNaoEncontradas: string[], professoresNaoEncontrados: string[], nomesOcorrencias: Record<string, number>) {
  console.log(`${studentsToAdd.length} novos alunos para adicionar`);
  
  if (turmasNaoEncontradas.length > 0) {
    console.log(`Turmas não encontradas (${turmasNaoEncontradas.length}): ${turmasNaoEncontradas.join(', ')}`);
  }
  
  if (professoresNaoEncontrados.length > 0) {
    console.log(`Professores não encontrados (${professoresNaoEncontrados.length}): ${professoresNaoEncontrados.join(', ')}`);
  }
  
  // Log das turmas mais frequentes no dataset
  console.log("Top 10 turmas mais frequentes na planilha:");
  Object.entries(nomesOcorrencias)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([nome, count]) => {
      console.log(`"${nome}": ${count} alunos`);
    });
}

// Main request handler
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const result = await syncStudents();
    
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

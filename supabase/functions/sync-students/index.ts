import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY') || '';
const SPREADSHEET_ID = Deno.env.get('GOOGLE_SPREADSHEET_ID') || '';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Function to validate environment vars with provided keys
function validateEnvironmentVars(googleApiKey: string, spreadsheetId: string) {
  console.log("Validando credenciais fornecidas...");
  
  if (!googleApiKey) {
    throw new Error('Google API Key não fornecida');
  }
  
  if (!spreadsheetId) {
    throw new Error('Google Spreadsheet ID não fornecido');
  }

  console.log("Credenciais validadas com sucesso");
}

// Function to fetch data from Google Sheets using provided keys
async function fetchGoogleSheetsData(googleApiKey: string, spreadsheetId: string) {
  console.log("Buscando dados da planilha...");
  
  const sheetName = 'SGS>Alunos'; 
  const sheetsApiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}?key=${googleApiKey}`;
  console.log(`Acessando URL: ${sheetsApiUrl.replace(googleApiKey, 'API_KEY_HIDDEN')}`);
  
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
function processHeaders(headers) {
  console.log("Processando cabeçalhos:", headers);

  const columnIndexes = {
    nomeIndex: headers.findIndex(h => h === 'Nome'),
    turmaIndex: headers.findIndex(h => h === 'Turma atual'),
    professorIndex: headers.findIndex(h => h === 'Professor'),
    indiceIndex: headers.findIndex(h => h === 'Índice'),
    codigoIndex: headers.findIndex(h => h === 'Código'),
    telefoneIndex: headers.findIndex(h => h === 'Telefone'),
    emailIndex: headers.findIndex(h => h === 'E-mail'),
    cursoIndex: headers.findIndex(h => h === 'Curso'),
    matriculaIndex: headers.findIndex(h => h === 'Matrícula'),
    idadeIndex: headers.findIndex(h => h === 'Idade'),
    ultimoNivelIndex: headers.findIndex(h => h === 'Último nível'),
    diasApostilaIndex: headers.findIndex(h => h === 'Dias na apostila'),
    diasSuperaIndex: headers.findIndex(h => h === 'Dias no Supera'),
    vencimentoContratoIndex: headers.findIndex(h => h === 'Vencimento do contrato')
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
function extractDataFromRows(rows, headerRow, columnIndexes) {
  console.log(`Extraindo dados de ${rows.length - (headerRow + 1)} linhas...`);
  
  // Extract data from rows starting after the header row
  const rawData = rows.slice(headerRow + 1).map(row => {
    // Creating an object with all available columns
    const rowData = {
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
  }).filter(data => 
    data.nome && data.turma_nome  // Filtering only valid data with name and class
  );

  console.log(`Extraídos ${rawData.length} registros válidos da planilha`);
  return rawData;
}

// Function to determine weekday from class name
function getDiaSemanaFromTurmaNome(turmaNome: string): "segunda" | "terca" | "quarta" | "quinta" | "sexta" | "sabado" | "domingo" {
  const nomeLowerCase = turmaNome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  
  if (nomeLowerCase.startsWith('S') || nomeLowerCase.includes('sabado')) return 'sabado';
  if (nomeLowerCase.startsWith('2')) return 'segunda';
  if (nomeLowerCase.startsWith('3')) return 'terca';
  if (nomeLowerCase.startsWith('4')) return 'quarta';
  if (nomeLowerCase.startsWith('5')) return 'quinta';
  if (nomeLowerCase.startsWith('6')) return 'sexta';
  
  console.log(`Nome de turma não reconhecido para dia da semana: ${turmaNome}. Usando segunda como padrão.`);
  return 'segunda'; // fallback para manter compatibilidade
}

// Função para obter o ID da unidade de Maringá
async function getMaringaUnitId() {
  console.log("Obtendo ID da unidade de Maringá...");
  
  // Buscando unidade pelo nome (ajuste o nome exato se necessário)
  const { data: unidadeData, error: unidadeError } = await supabase
    .from('units')
    .select('id')
    .eq('name', 'Maringá')
    .maybeSingle();
    
  if (unidadeError) {
    console.error("Erro ao buscar unidade de Maringá:", unidadeError.message);
    
    // Tentar buscar por qualquer unidade disponível como fallback
    const { data: qualquerUnidade, error: fallbackError } = await supabase
      .from('units')
      .select('id')
      .limit(1)
      .single();
      
    if (fallbackError || !qualquerUnidade) {
      throw new Error(`Não foi possível encontrar nenhuma unidade no sistema: ${fallbackError?.message || "Nenhum registro encontrado"}`);
    }
    
    console.log(`Usando unidade ID alternativa: ${qualquerUnidade.id} (fallback)`);
    return qualquerUnidade.id;
  }
  
  if (!unidadeData) {
    console.warn("Unidade de Maringá não encontrada. Buscando qualquer unidade disponível.");
    
    // Tentar buscar por qualquer unidade disponível como fallback
    const { data: qualquerUnidade, error: fallbackError } = await supabase
      .from('units')
      .select('id')
      .limit(1)
      .single();
      
    if (fallbackError || !qualquerUnidade) {
      throw new Error(`Não foi possível encontrar nenhuma unidade no sistema: ${fallbackError?.message || "Nenhum registro encontrado"}`);
    }
    
    console.log(`Usando unidade ID alternativa: ${qualquerUnidade.id} (fallback)`);
    return qualquerUnidade.id;
  }
  
  console.log(`Unidade de Maringá encontrada com ID: ${unidadeData.id}`);
  return unidadeData.id;
}

// STEP 1: Extract unique professors from spreadsheet and sync to database
async function syncProfessors(rawData) {
  console.log("Sincronizando professores...");
  
  // Extract unique professors
  const uniqueProfessors = new Set();
  
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
    // Obter o ID da unidade de Maringá
    const maringaUnitId = await getMaringaUnitId();
    
    // Corrigir a sintaxe do insert
    const { data: insertedProfessors, error: insertError } = await supabase
      .from('professores')
      .insert(professorsToAdd.map(nome => ({ 
        nome, 
        unit_id: maringaUnitId
      })))
      .select();
    
    if (insertError) {
      throw new Error(`Erro ao inserir novos professores: ${insertError.message}`);
    }
    
    console.log(`${insertedProfessors.length} professores adicionados com sucesso`);
    
    return [...existingProfessors, ...insertedProfessors];
  }
  
  return existingProfessors;
}

// STEP 2: Extract unique turmas from spreadsheet and sync to database
async function syncTurmas(rawData, professors) {
  console.log("Sincronizando turmas...");
  
  // Create a map of professor names to IDs for quick lookup
  const professorMap = new Map(
    professors.map(p => [p.nome.toLowerCase().trim(), p.id])
  );
  
  // Extract unique turmas with their professor associations
  const turmasMap = new Map();
  
  rawData.forEach(row => {
    if (row.turma_nome && row.turma_nome.trim() !== '') {
      const turmaNome = row.turma_nome.trim();
      const professorNome = row.professor_nome ? row.professor_nome.trim() : null;
      
      // Only add or update if we don't have this turma yet, or if we're adding professor info
      if (!turmasMap.has(turmaNome) || (!turmasMap.get(turmaNome)?.professor_nome && professorNome)) {
        turmasMap.set(turmaNome, { 
          nome: turmaNome, 
          professor_nome: professorNome,
          dia_semana: getDiaSemanaFromTurmaNome(turmaNome) // Using our new function here
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
  
  // Get existing turmas from database - removido 'horario' do select
  const { data: existingTurmas, error: fetchError } = await supabase
    .from('turmas')
    .select('id, nome, professor_id, dia_semana');
  
  if (fetchError) {
    throw new Error(`Erro ao buscar turmas existentes: ${fetchError.message}`);
  }
  
  // Map existing turmas by name for easy lookup
  const existingTurmasMap = new Map(
    existingTurmas.map(t => [t.nome.toLowerCase().trim(), t])
  );
  
  // Obter o ID da unidade de Maringá
  const maringaUnitId = await getMaringaUnitId();
  console.log(`Usando unidade de Maringá ID: ${maringaUnitId} para todas as turmas`);
  
  // Prepare turmas to add or update
  const turmasToAdd = [];
  const turmasToUpdate = [];
  
  for (const turma of turmasArray) {
    const existingTurma = existingTurmasMap.get(turma.nome.toLowerCase().trim());
    const professorId = turma.professor_nome ? 
      professorMap.get(turma.professor_nome.toLowerCase().trim()) : null;
    
    if (!existingTurma) {
      // New turma to add - removido 'horario' do insert
      turmasToAdd.push({
        nome: turma.nome,
        professor_id: professorId,
        dia_semana: turma.dia_semana, // Using the detected weekday
        unit_id: maringaUnitId  // Usando o ID da unidade de Maringá
      });
    } else if (
      professorId && existingTurma.professor_id !== professorId ||
      existingTurma.dia_semana !== turma.dia_semana // Also update if weekday changed
    ) {
      // Existing turma with professor or weekday change
      turmasToUpdate.push({
        id: existingTurma.id,
        professor_id: professorId,
        dia_semana: turma.dia_semana,
        unit_id: maringaUnitId  // Sempre atualizar para a unidade de Maringá
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
      .update({ 
        professor_id: turma.professor_id,
        dia_semana: turma.dia_semana,
        unit_id: turma.unit_id  // Garantindo que unit_id seja atualizado para Maringá
      })
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

// STEP 3: Sync students with NOME as primary criterion - UPDATED LOGIC
async function syncStudents(rawData, turmas) {
  console.log("Sincronizando alunos com prioridade para NOME...");
  
  // Create a map of turma names to IDs for quick lookup
  const turmaMap = new Map(
    turmas.map(t => [t.nome.toLowerCase().trim(), t.id])
  );
  
  // Obter o ID da unidade de Maringá
  const maringaUnitId = await getMaringaUnitId();
  console.log(`Usando unidade de Maringá ID: ${maringaUnitId} para todos os alunos`);
  
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
      unit_id: maringaUnitId,
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
    
    let alunosNovos = 0;
    let alunosAtualizados = 0;
    let alunosTrocasTurma = 0;
    
    // Agora, para cada aluno na planilha - PRIORIDADE PARA NOME
    for (const studentData of studentsData) {
      let existingStudent = null;
      
      console.log(`\n=== Processando aluno: ${studentData.nome} ===`);
      
      // NOVO: Buscar aluno existente PRIMEIRO por NOME (critério principal)
      console.log(`Buscando por nome: "${studentData.nome}"`);
      const { data: studentByName, error: fetchByNameError } = await supabase
        .from('alunos')
        .select('id, nome, turma_id, codigo')
        .eq('nome', studentData.nome)
        .maybeSingle();
        
      if (fetchByNameError) {
        console.error(`Erro ao buscar aluno por nome ${studentData.nome}:`, fetchByNameError);
      } else if (studentByName) {
        console.log(`✓ Aluno encontrado por NOME - ID: ${studentByName.id}`);
        existingStudent = studentByName;
      }
      
      // FALLBACK: Se não encontrou por nome E temos código, buscar por código
      if (!existingStudent && studentData.codigo && studentData.codigo.trim() !== '') {
        console.log(`Não encontrado por nome. Tentando buscar por código: "${studentData.codigo}"`);
        const { data: studentByCode, error: fetchByCodeError } = await supabase
          .from('alunos')
          .select('id, nome, turma_id, codigo')
          .eq('codigo', studentData.codigo.trim())
          .maybeSingle();
          
        if (fetchByCodeError) {
          console.error(`Erro ao buscar aluno por código ${studentData.codigo}:`, fetchByCodeError);
        } else if (studentByCode) {
          console.log(`✓ Aluno encontrado por CÓDIGO - ID: ${studentByCode.id}`);
          existingStudent = studentByCode;
          
          // IMPORTANTE: Se encontrou por código mas o nome é diferente, avisar!
          if (studentByCode.nome !== studentData.nome) {
            console.warn(`⚠️ ATENÇÃO: Aluno encontrado por código tem nome diferente!`);
            console.warn(`   Nome no banco: "${studentByCode.nome}"`);
            console.warn(`   Nome na planilha: "${studentData.nome}"`);
            console.warn(`   Mantendo nome da planilha como principal`);
          }
        }
      }
      
      if (existingStudent) {
        // Verificar se houve mudança de turma
        const trocouTurma = existingStudent.turma_id !== studentData.turma_id;
        
        if (trocouTurma) {
          console.log(`🔄 MUDANÇA DE TURMA detectada para ${studentData.nome}:`);
          console.log(`   Turma anterior ID: ${existingStudent.turma_id}`);
          console.log(`   Nova turma ID: ${studentData.turma_id}`);
          alunosTrocasTurma++;
        }
        
        // Atualizar aluno existente (incluindo nova turma se houve troca)
        // Remove ultima_correcao_ah do update para preservar o valor existente
        const { ultima_correcao_ah, ...dadosAtualizacao } = studentData;
        const { error: updateError } = await supabase
          .from('alunos')
          .update(dadosAtualizacao)
          .eq('id', existingStudent.id);
          
        if (updateError) {
          console.error(`❌ Erro ao atualizar aluno ${studentData.nome}:`, updateError);
        } else {
          alunosAtualizados++;
          console.log(`✅ Aluno ${studentData.nome} atualizado com sucesso`);
          if (trocouTurma) {
            console.log(`   ✓ Nova turma aplicada`);
          }
        }
      } else {
        // Inserir novo aluno com ultima_correcao_ah definida
        console.log(`➕ Novo aluno detectado: ${studentData.nome}`);
        const { error: insertError } = await supabase
          .from('alunos')
          .insert([{
            ...studentData,
            ultima_correcao_ah: new Date().toISOString() // Define data de entrada para novos alunos
          }]);
          
        if (insertError) {
          console.error(`❌ Erro ao inserir aluno ${studentData.nome}:`, insertError);
        } else {
          alunosNovos++;
          console.log(`✅ Novo aluno ${studentData.nome} inserido com sucesso`);
        }
      }
    }
    
    console.log(`\n=== ESTATÍSTICAS DA SINCRONIZAÇÃO ===`);
    console.log(`✅ Alunos novos: ${alunosNovos}`);
    console.log(`🔄 Alunos atualizados: ${alunosAtualizados}`);
    console.log(`🏫 Alunos que trocaram de turma: ${alunosTrocasTurma}`);
    console.log(`📊 Total processado: ${studentsData.length}`);
    
    // Retornar os alunos ativos após a sincronização
    const { data: activeStudents, error: fetchActiveError } = await supabase
      .from('alunos')
      .select('*')
      .eq('active', true);
      
    if (fetchActiveError) {
      throw fetchActiveError;
    }
    
    console.log(`✅ Sincronização concluída. ${activeStudents?.length || 0} alunos ativos no sistema.`);
    
    return activeStudents || [];
  } catch (error) {
    console.error('❌ Erro durante a sincronização de alunos:', error);
    throw error;
  }
}

// Main function to handle the full sync process
async function syncFromGoogleSheets(googleApiKey: string, spreadsheetId: string) {
  try {
    console.log("Iniciando sincronização completa com Google Sheets");
    
    // Validate provided keys
    validateEnvironmentVars(googleApiKey, spreadsheetId);
    
    // Fetch Google Sheets data with provided keys
    const data = await fetchGoogleSheetsData(googleApiKey, spreadsheetId);
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
      details: error.stack
    };
  }
}

// Main request handler
Deno.serve(async (req) => {
  console.log(`Recebida requisição ${req.method}`);
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Tentativa de uso da sincronização Google Sheets - FUNCIONALIDADE TEMPORARIAMENTE DESABILITADA');
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Sincronização Google Sheets temporariamente desabilitada. Use a importação via Excel disponível na tela de Turmas.'
    }), {
      status: 400,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }
    });
    
    /* CÓDIGO ORIGINAL COMENTADO TEMPORARIAMENTE
    // Get API keys from request body
    const { googleApiKey, spreadsheetId } = await req.json();
    console.log('Chaves recebidas:', { 
      googleApiKey: googleApiKey ? 'present' : 'missing', 
      spreadsheetId: spreadsheetId ? 'present' : 'missing' 
    });
    
    const result = await syncFromGoogleSheets(googleApiKey, spreadsheetId);
    console.log('Resultado da sincronização:', result);
    
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
    */
  } catch (error) {
    console.error('Erro:', error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Sincronização Google Sheets temporariamente desabilitada. Use a importação via Excel disponível na tela de Turmas.'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400,
      }
    );
  }
});

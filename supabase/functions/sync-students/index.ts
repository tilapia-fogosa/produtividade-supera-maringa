
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
    const sheetName = 'SGS>Alunos'; 
    const sheetsApiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}?key=${GOOGLE_API_KEY}`;
    console.log(`Acessando URL: ${sheetsApiUrl.replace(GOOGLE_API_KEY, 'API_KEY_HIDDEN')}`);
    
    const response = await fetch(sheetsApiUrl);
    const responseText = await response.text(); // Vamos obter o texto da resposta primeiro

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

    const rows = data.values || [];

    if (rows.length <= 5) {  // Verificando se temos pelo menos a linha de cabeçalho e um dado
      throw new Error('Nenhum dado encontrado na planilha ou apenas cabeçalhos presentes');
    }

    // O cabeçalho está na linha 5 (índice 4)
    const headerRow = 4;
    console.log(`Processando ${rows.length} linhas de dados...`);
    
    // Obtendo os cabeçalhos da linha 5
    const headers = rows[headerRow];
    console.log("Cabeçalhos encontrados:", headers);

    // Encontrando os índices das colunas necessárias
    const nomeIndex = headers.findIndex((h: string) => h === 'Nome');
    const turmaIndex = headers.findIndex((h: string) => h === 'Turma atual');
    const professorIndex = headers.findIndex((h: string) => h === 'Professor');
    const indiceIndex = headers.findIndex((h: string) => h === 'Índice');
    const codigoIndex = headers.findIndex((h: string) => h === 'Código');
    const telefoneIndex = headers.findIndex((h: string) => h === 'Telefone');
    const emailIndex = headers.findIndex((h: string) => h === 'E-mail');
    const cursoIndex = headers.findIndex((h: string) => h === 'Curso');
    const matriculaIndex = headers.findIndex((h: string) => h === 'Matrícula');
    const idadeIndex = headers.findIndex((h: string) => h === 'Idade');
    const ultimoNivelIndex = headers.findIndex((h: string) => h === 'Último nível');
    const diasApostilaIndex = headers.findIndex((h: string) => h === 'Dias na apostila');
    const diasSuperaIndex = headers.findIndex((h: string) => h === 'Dias no Supera');
    const vencimentoContratoIndex = headers.findIndex((h: string) => h === 'Vencimento do contrato');

    // Verificando se as colunas obrigatórias foram encontradas
    if (nomeIndex === -1 || turmaIndex === -1) {
      throw new Error('Colunas obrigatórias não encontradas na planilha. É necessário ter colunas com "Nome" e "Turma atual" no cabeçalho.');
    }

    // Extract student data começando da linha após o cabeçalho (linha 6, índice 5)
    const students = rows.slice(headerRow + 1).map((row: string[]) => {
      // Criando o objeto do aluno com todas as colunas disponíveis
      const student: Record<string, any> = {
        nome: row[nomeIndex] || '',
        turma_nome: row[turmaIndex] || '',
        professor_nome: row[professorIndex] || '',
      };

      // Adicionando campos opcionais se existirem
      if (indiceIndex !== -1) student.indice = row[indiceIndex] || '';
      if (codigoIndex !== -1) student.codigo = row[codigoIndex] || '';
      if (telefoneIndex !== -1) student.telefone = row[telefoneIndex] || '';
      if (emailIndex !== -1) student.email = row[emailIndex] || '';
      if (cursoIndex !== -1) student.curso = row[cursoIndex] || '';
      if (matriculaIndex !== -1) student.matricula = row[matriculaIndex] || '';
      if (idadeIndex !== -1) student.idade = row[idadeIndex] ? parseInt(row[idadeIndex]) : null;
      if (ultimoNivelIndex !== -1) student.ultimo_nivel = row[ultimoNivelIndex] || '';
      if (diasApostilaIndex !== -1) student.dias_apostila = row[diasApostilaIndex] ? parseInt(row[diasApostilaIndex]) : null;
      if (diasSuperaIndex !== -1) student.dias_supera = row[diasSuperaIndex] ? parseInt(row[diasSuperaIndex]) : null;
      if (vencimentoContratoIndex !== -1) student.vencimento_contrato = row[vencimentoContratoIndex] || '';

      return student;
    }).filter((student: Record<string, any>) => 
      student.nome && student.turma_nome  // Filtrando apenas alunos com nome e turma
    );

    console.log(`Extraídos ${students.length} alunos válidos da planilha`);

    // Primeiro, buscar professores e turmas para associar aos alunos
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

    // Mapear professores por nome para rápido acesso
    const professoresPorNome = professores.reduce((acc: Record<string, string>, prof: any) => {
      acc[prof.nome.toLowerCase()] = prof.id;
      return acc;
    }, {});

    // Mapear turmas por nome e professor_id para rápido acesso
    const turmasPorNome = turmas.reduce((acc: Record<string, string>, turma: any) => {
      acc[`${turma.nome.toLowerCase()}_${turma.professor_id}`] = turma.id;
      return acc;
    }, {});

    // Preparar alunos para inserção, mapeando turmas
    const studentsToAdd = [];
    const turmasNaoEncontradas = new Set();
    const professoresNaoEncontrados = new Set();

    for (const student of students) {
      // Processar apenas se tiver nome e turma
      if (student.nome && student.turma_nome) {
        const professorId = student.professor_nome ? 
          professoresPorNome[student.professor_nome.toLowerCase()] : 
          null;

        // Se não encontramos o professor, registrar para reportar
        if (student.professor_nome && !professorId) {
          professoresNaoEncontrados.add(student.professor_nome);
        }

        // Tentar encontrar a turma pelo nome e professor
        let turmaId = null;
        if (professorId) {
          turmaId = turmasPorNome[`${student.turma_nome.toLowerCase()}_${professorId}`];
        }

        // Se não encontramos com professor específico, procurar qualquer turma com esse nome
        if (!turmaId) {
          // Buscar qualquer turma com esse nome
          const turmaComNome = turmas.find(t => t.nome.toLowerCase() === student.turma_nome.toLowerCase());
          if (turmaComNome) {
            turmaId = turmaComNome.id;
          } else {
            turmasNaoEncontradas.add(student.turma_nome);
            continue; // Pular este aluno se não tiver turma correspondente
          }
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

    console.log(`${studentsToAdd.length} novos alunos para adicionar`);
    if (turmasNaoEncontradas.size > 0) {
      console.log(`Turmas não encontradas: ${Array.from(turmasNaoEncontradas).join(', ')}`);
    }
    if (professoresNaoEncontrados.size > 0) {
      console.log(`Professores não encontrados: ${Array.from(professoresNaoEncontrados).join(', ')}`);
    }

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

    // Insert new students
    let insertResult = null;
    let insertError = null;
    if (alunosUnicos.length > 0) {
      const { data: insertData, error: insError } = await supabase
        .from('alunos')
        .insert(alunosUnicos)
        .select();

      insertResult = insertData;
      insertError = insError;

      if (insError) {
        console.error(`Erro ao inserir alunos: ${insError.message}`);
        throw new Error(`Erro ao inserir alunos: ${insError.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sincronização concluída. Adicionados ${alunosUnicos.length} novos alunos.`,
        addedStudents: insertResult,
        warnings: {
          turmasNaoEncontradas: Array.from(turmasNaoEncontradas),
          professoresNaoEncontrados: Array.from(professoresNaoEncontrados)
        }
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

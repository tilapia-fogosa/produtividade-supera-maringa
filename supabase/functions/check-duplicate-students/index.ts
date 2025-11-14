
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDuplicateStudents(studentNames: string[]) {
  console.log("Verificando alunos duplicados para:", studentNames);
  
  const results = [];
  
  for (const studentName of studentNames) {
    console.log(`\n=== Analisando: ${studentName} ===`);
    
    // Buscar todos os registros (ativos e inativos) para este nome
    const { data: allRecords, error } = await supabase
      .from('alunos')
      .select(`
        id,
        nome,
        turma_id,
        active,
        created_at,
        updated_at,
        codigo,
        email,
        telefone,
        turmas:turma_id (
          id,
          nome,
          professor_id,
          professores:professor_id (
            nome
          )
        )
      `)
      .ilike('nome', `%${studentName}%`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(`Erro ao buscar registros para ${studentName}:`, error);
      continue;
    }
    
    console.log(`Encontrados ${allRecords?.length || 0} registros para ${studentName}`);
    
    if (allRecords && allRecords.length > 1) {
      // Analisar duplicatas
      const activeRecords = allRecords.filter(r => r.active);
      const inactiveRecords = allRecords.filter(r => !r.active);
      
      console.log(`- Registros ativos: ${activeRecords.length}`);
      console.log(`- Registros inativos: ${inactiveRecords.length}`);
      
      // Verificar se há múltiplos registros ativos (problema)
      if (activeRecords.length > 1) {
        console.log("⚠️ PROBLEMA: Múltiplos registros ativos encontrados!");
        
        activeRecords.forEach((record, index) => {
          console.log(`Registro ativo ${index + 1}:`);
          console.log(`- ID: ${record.id}`);
          console.log(`- Turma: ${record.turmas?.nome || 'Sem turma'}`);
          console.log(`- Professor: ${record.turmas?.professores?.nome || 'Sem professor'}`);
          console.log(`- Código: ${record.codigo || 'Sem código'}`);
          console.log(`- Criado em: ${record.created_at}`);
          console.log(`- Atualizado em: ${record.updated_at}`);
        });
      }
      
      // Mostrar histórico completo
      console.log("\n📋 Histórico completo:");
      allRecords.forEach((record, index) => {
        console.log(`${index + 1}. ${record.active ? '✅ ATIVO' : '❌ INATIVO'}`);
        console.log(`   ID: ${record.id}`);
        console.log(`   Turma: ${record.turmas?.nome || 'Sem turma'}`);
        console.log(`   Professor: ${record.turmas?.professores?.nome || 'Sem professor'}`);
        console.log(`   Código: ${record.codigo || 'Sem código'}`);
        console.log(`   Criado: ${new Date(record.created_at).toLocaleString('pt-BR')}`);
        console.log(`   Atualizado: ${new Date(record.updated_at).toLocaleString('pt-BR')}`);
        console.log('');
      });
      
      results.push({
        studentName,
        totalRecords: allRecords.length,
        activeRecords: activeRecords.length,
        inactiveRecords: inactiveRecords.length,
        hasProblem: activeRecords.length > 1,
        records: allRecords.map(record => ({
          id: record.id,
          active: record.active,
          turma: record.turmas?.nome,
          professor: record.turmas?.professores?.nome,
          codigo: record.codigo,
          created_at: record.created_at,
          updated_at: record.updated_at
        }))
      });
    } else if (allRecords && allRecords.length === 1) {
      console.log("✅ Apenas um registro encontrado - sem duplicação");
      results.push({
        studentName,
        totalRecords: 1,
        activeRecords: allRecords[0].active ? 1 : 0,
        inactiveRecords: allRecords[0].active ? 0 : 1,
        hasProblem: false,
        records: [allRecords[0]]
      });
    } else {
      console.log("❓ Nenhum registro encontrado");
      results.push({
        studentName,
        totalRecords: 0,
        activeRecords: 0,
        inactiveRecords: 0,
        hasProblem: false,
        records: []
      });
    }
  }
  
  return results;
}

async function fixDuplicateStudents(studentName: string, keepRecordId: string) {
  console.log(`Corrigindo duplicação para ${studentName}, mantendo registro ${keepRecordId}`);
  
  // Buscar todos os registros ativos para este aluno
  const { data: activeRecords, error: fetchError } = await supabase
    .from('alunos')
    .select('id, nome, turma_id')
    .ilike('nome', `%${studentName}%`)
    .eq('active', true);
    
  if (fetchError) {
    throw new Error(`Erro ao buscar registros ativos: ${fetchError.message}`);
  }
  
  if (!activeRecords || activeRecords.length <= 1) {
    return { message: "Nenhuma duplicação encontrada para corrigir" };
  }
  
  // Verificar se o ID para manter existe
  const recordToKeep = activeRecords.find(r => r.id === keepRecordId);
  if (!recordToKeep) {
    throw new Error(`Registro ${keepRecordId} não encontrado nos registros ativos`);
  }
  
  // Marcar todos os outros como inativos
  const recordsToDeactivate = activeRecords.filter(r => r.id !== keepRecordId);
  
  console.log(`Desativando ${recordsToDeactivate.length} registros duplicados`);
  
  for (const record of recordsToDeactivate) {
    const { error: updateError } = await supabase
      .from('alunos')
      .update({ active: false })
      .eq('id', record.id);
      
    if (updateError) {
      console.error(`Erro ao desativar registro ${record.id}:`, updateError);
    } else {
      console.log(`✅ Registro ${record.id} desativado com sucesso`);
    }
  }
  
  return {
    message: `Duplicação corrigida para ${studentName}`,
    recordsDeactivated: recordsToDeactivate.length,
    recordKept: keepRecordId
  };
}

// Main request handler
Deno.serve(async (req) => {
  console.log(`Recebida requisição ${req.method}`);
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, studentNames, studentName, keepRecordId } = await req.json();
    
    let result;
    
    if (action === 'check') {
      // Verificar duplicatas
      result = await checkDuplicateStudents(studentNames || []);
    } else if (action === 'fix') {
      // Corrigir duplicatas
      if (!studentName || !keepRecordId) {
        throw new Error('studentName e keepRecordId são obrigatórios para correção');
      }
      result = await fixDuplicateStudents(studentName, keepRecordId);
    } else {
      throw new Error('Ação inválida. Use "check" ou "fix"');
    }
    
    console.log('Resultado:', result);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: result
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
    console.error('Erro não tratado:', error.message, error.stack);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.stack
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

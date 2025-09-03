import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface StudentData {
  'Índice': string;
  'Código': string;
  'Nome': string;
  'Telefone': string;
  'E-mail': string;
  'Curso': string;
  'Matrícula': string;
  'Turma atual': string;
  'Professor': string;
  'Idade': string;
  'Último nível': string;
  'Dias na apostila': string;
  'Dias no Supera': string;
  'Vencimento do contrato': string;
}

interface SyncResult {
  processedCount: number;
  newStudents: number;
  updatedStudents: number;
  errors: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { studentsData, unitId, uploadedBy } = await req.json();

    if (!studentsData || !unitId || !uploadedBy) {
      throw new Error('Dados obrigatórios não fornecidos');
    }

    console.log(`Iniciando sincronização de ${studentsData.length} alunos para unidade ${unitId}`);

    const result: SyncResult = {
      processedCount: 0,
      newStudents: 0,
      updatedStudents: 0,
      errors: []
    };

    // Processar cada aluno
    for (const studentRow of studentsData) {
      try {
        result.processedCount++;
        
        // Mapear dados do Excel para o formato da tabela alunos
        const studentData = {
          indice: studentRow['Índice'] || '',
          codigo: studentRow['Código'] || '',
          nome: studentRow['Nome'] || '',
          telefone: studentRow['Telefone'] || '',
          email: studentRow['E-mail'] || '',
          curso: studentRow['Curso'] || '',
          matricula: studentRow['Matrícula'] || '',
          idade: studentRow['Idade'] ? parseInt(studentRow['Idade']) || null : null,
          ultimo_nivel: studentRow['Último nível'] || '',
          dias_apostila: studentRow['Dias na apostila'] ? parseInt(studentRow['Dias na apostila']) || null : null,
          dias_supera: studentRow['Dias no Supera'] ? parseInt(studentRow['Dias no Supera']) || null : null,
          vencimento_contrato: studentRow['Vencimento do contrato'] || '',
          unit_id: unitId,
          active: true
        };

        // Verificar se o aluno já existe (por código ou nome)
        const { data: existingStudent } = await supabase
          .from('alunos')
          .select('id, nome, codigo')
          .eq('unit_id', unitId)
          .or(`codigo.eq.${studentData.codigo},nome.eq.${studentData.nome}`)
          .single();

        let turmaId = null;
        let professorId = null;

        // Processar turma se fornecida
        if (studentRow['Turma atual']) {
          const { data: turma } = await supabase
            .from('turmas')
            .select('id')
            .eq('nome', studentRow['Turma atual'])
            .eq('unit_id', unitId)
            .single();

          if (turma) {
            turmaId = turma.id;
          } else {
            // Criar nova turma se não existir
            const { data: novaTurma } = await supabase
              .from('turmas')
              .insert({
                nome: studentRow['Turma atual'],
                unit_id: unitId,
                dia_semana: 'segunda' // valor padrão
              })
              .select('id')
              .single();
            
            if (novaTurma) {
              turmaId = novaTurma.id;
            }
          }
        }

        // Processar professor se fornecido
        if (studentRow['Professor']) {
          const { data: professor } = await supabase
            .from('professores')
            .select('id')
            .eq('nome', studentRow['Professor'])
            .single();

          if (professor) {
            professorId = professor.id;
          } else {
            // Criar novo professor se não existir
            const { data: novoProfessor } = await supabase
              .from('professores')
              .insert({
                nome: studentRow['Professor'],
                unit_id: unitId
              })
              .select('id')
              .single();
            
            if (novoProfessor) {
              professorId = novoProfessor.id;
            }
          }
        }

        // Adicionar turma_id ao studentData se encontrada/criada
        if (turmaId) {
          studentData.turma_id = turmaId;
        }

        if (existingStudent) {
          // Atualizar aluno existente
          const { error: updateError } = await supabase
            .from('alunos')
            .update(studentData)
            .eq('id', existingStudent.id);

          if (updateError) {
            result.errors.push(`Erro ao atualizar ${studentData.nome}: ${updateError.message}`);
          } else {
            result.updatedStudents++;
          }
        } else {
          // Criar novo aluno
          const { error: insertError } = await supabase
            .from('alunos')
            .insert(studentData);

          if (insertError) {
            result.errors.push(`Erro ao criar ${studentData.nome}: ${insertError.message}`);
          } else {
            result.newStudents++;
          }
        }

        // Atualizar professor da turma se necessário
        if (turmaId && professorId) {
          await supabase
            .from('turmas')
            .update({ professor_id: professorId })
            .eq('id', turmaId);
        }

      } catch (error) {
        result.errors.push(`Erro no processamento do aluno ${studentRow?.['Nome'] || 'desconhecido'}: ${error.message}`);
        console.error('Erro ao processar aluno:', error);
      }
    }

    console.log('Sincronização concluída:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na sincronização SGS:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        processedCount: 0,
        newStudents: 0,
        updatedStudents: 0,
        errors: [error.message]
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface XlsData {
  turmas: any[];
  professores: any[];
  alunos: any[];
}

interface ProcessResult {
  turmas_criadas: number;
  professores_criados: number;
  alunos_criados: number;
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

    const { xlsData, fileName }: { xlsData: XlsData; fileName: string } = await req.json();
    
    console.log(`Processando arquivo: ${fileName}`);
    console.log(`Dados recebidos - Turmas: ${xlsData.turmas?.length}, Professores: ${xlsData.professores?.length}, Alunos: ${xlsData.alunos?.length}`);

    const result: ProcessResult = {
      turmas_criadas: 0,
      professores_criados: 0,
      alunos_criados: 0,
      errors: []
    };

    // Processar professores primeiro
    if (xlsData.professores && xlsData.professores.length > 0) {
      console.log('Processando professores...');
      
      for (const professorData of xlsData.professores) {
        try {
          if (!professorData.nome) {
            result.errors.push('Professor sem nome encontrado');
            continue;
          }

          // Verificar se professor já existe
          const { data: existingProfessor } = await supabase
            .from('professores')
            .select('id, nome')
            .eq('nome', professorData.nome)
            .single();

          if (!existingProfessor) {
            const { error } = await supabase
              .from('professores')
              .insert({
                nome: professorData.nome,
                slack_username: professorData.slack_username || null
              });

            if (error) {
              console.error('Erro ao inserir professor:', error);
              result.errors.push(`Erro ao inserir professor ${professorData.nome}: ${error.message}`);
            } else {
              result.professores_criados++;
              console.log(`Professor criado: ${professorData.nome}`);
            }
          } else {
            console.log(`Professor já existe: ${professorData.nome}`);
          }

        } catch (error) {
          console.error('Erro ao processar professor:', error);
          result.errors.push(`Erro ao processar professor: ${error.message}`);
        }
      }
    }

    // Processar turmas
    if (xlsData.turmas && xlsData.turmas.length > 0) {
      console.log('Processando turmas...');
      
      for (const turmaData of xlsData.turmas) {
        try {
          if (!turmaData.nome || !turmaData.professor_nome) {
            result.errors.push('Turma sem nome ou professor encontrada');
            continue;
          }

          // Buscar o professor
          const { data: professor } = await supabase
            .from('professores')
            .select('id')
            .eq('nome', turmaData.professor_nome)
            .single();

          if (!professor) {
            result.errors.push(`Professor não encontrado: ${turmaData.professor_nome}`);
            continue;
          }

          // Verificar se turma já existe
          const { data: existingTurma } = await supabase
            .from('turmas')
            .select('id, nome')
            .eq('nome', turmaData.nome)
            .single();

          if (!existingTurma) {
            // Validar dia_semana
            const validDays = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
            const diaSemana = turmaData.dia_semana?.toLowerCase();
            
            if (!validDays.includes(diaSemana)) {
              result.errors.push(`Dia da semana inválido para turma ${turmaData.nome}: ${turmaData.dia_semana}`);
              continue;
            }

            const { error } = await supabase
              .from('turmas')
              .insert({
                nome: turmaData.nome,
                professor_id: professor.id,
                dia_semana: diaSemana,
                sala: turmaData.sala || '',
                horario_inicio: turmaData.horario_inicio || '',
                categoria: turmaData.categoria || 'Supera',
                unit_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' // ID padrão, pode ser configurado
              });

            if (error) {
              console.error('Erro ao inserir turma:', error);
              result.errors.push(`Erro ao inserir turma ${turmaData.nome}: ${error.message}`);
            } else {
              result.turmas_criadas++;
              console.log(`Turma criada: ${turmaData.nome}`);
            }
          } else {
            console.log(`Turma já existe: ${turmaData.nome}`);
          }

        } catch (error) {
          console.error('Erro ao processar turma:', error);
          result.errors.push(`Erro ao processar turma: ${error.message}`);
        }
      }
    }

    // Processar alunos
    if (xlsData.alunos && xlsData.alunos.length > 0) {
      console.log('Processando alunos...');
      
      for (const alunoData of xlsData.alunos) {
        try {
          if (!alunoData.nome || !alunoData.turma_nome) {
            result.errors.push('Aluno sem nome ou turma encontrado');
            continue;
          }

          // Buscar a turma
          const { data: turma } = await supabase
            .from('turmas')
            .select('id')
            .eq('nome', alunoData.turma_nome)
            .single();

          if (!turma) {
            result.errors.push(`Turma não encontrada: ${alunoData.turma_nome}`);
            continue;
          }

          // Verificar se aluno já existe na turma
          const { data: existingAluno } = await supabase
            .from('alunos')
            .select('id, nome')
            .eq('nome', alunoData.nome)
            .eq('turma_id', turma.id)
            .single();

          if (!existingAluno) {
            const { error } = await supabase
              .from('alunos')
              .insert({
                nome: alunoData.nome,
                turma_id: turma.id,
                idade: alunoData.idade ? parseInt(alunoData.idade) : null,
                telefone: alunoData.telefone || null,
                email: alunoData.email || null,
                unit_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' // ID padrão, pode ser configurado
              });

            if (error) {
              console.error('Erro ao inserir aluno:', error);
              result.errors.push(`Erro ao inserir aluno ${alunoData.nome}: ${error.message}`);
            } else {
              result.alunos_criados++;
              console.log(`Aluno criado: ${alunoData.nome}`);
            }
          } else {
            console.log(`Aluno já existe: ${alunoData.nome}`);
          }

        } catch (error) {
          console.error('Erro ao processar aluno:', error);
          result.errors.push(`Erro ao processar aluno: ${error.message}`);
        }
      }
    }

    console.log('Resultado final:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        turmas_criadas: 0,
        professores_criados: 0,
        alunos_criados: 0,
        errors: [error.message]
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
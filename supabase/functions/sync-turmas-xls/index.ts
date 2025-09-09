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
  professores_reativados: number;
  professores_criados: number;
  turmas_reativadas: number;
  turmas_criadas: number;
  alunos_reativados: number;
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

    // Unit ID fixo da unidade de Maringá
    const MARINGA_UNIT_ID = '0df79a04-444e-46ee-b218-59e4b1835f4a';
    
    console.log(`Processando arquivo: ${fileName}`);
    console.log(`Iniciando sincronização completa - Dados: ${xlsData.professores?.length} professores, ${xlsData.turmas?.length} turmas, ${xlsData.alunos?.length} alunos`);

    const result: ProcessResult = {
      professores_reativados: 0,
      professores_criados: 0,
      turmas_reativadas: 0,
      turmas_criadas: 0,
      alunos_reativados: 0,
      alunos_criados: 0,
      errors: []
    };

    // ETAPA 1: Desativar todos os registros da unidade
    console.log('Etapa 1: Desativando todos os registros existentes...');
    
    // Desativar todos professores da unidade
    const { error: profDeactivateError } = await supabase
      .from('professores')
      .update({ status: false })
      .eq('unit_id', MARINGA_UNIT_ID);

    if (profDeactivateError) {
      result.errors.push(`Erro ao desativar professores: ${profDeactivateError.message}`);
    }

    // Desativar todas turmas da unidade
    const { error: turmasDeactivateError } = await supabase
      .from('turmas')
      .update({ active: false })
      .eq('unit_id', MARINGA_UNIT_ID);

    if (turmasDeactivateError) {
      result.errors.push(`Erro ao desativar turmas: ${turmasDeactivateError.message}`);
    }

    // Desativar todos alunos da unidade
    const { error: alunosDeactivateError } = await supabase
      .from('alunos')
      .update({ active: false })
      .eq('unit_id', MARINGA_UNIT_ID);

    if (alunosDeactivateError) {
      result.errors.push(`Erro ao desativar alunos: ${alunosDeactivateError.message}`);
    }

    // ETAPA 2: Processar Professores
    console.log('Etapa 2: Processando professores...');
    if (xlsData.professores && xlsData.professores.length > 0) {
      for (const profData of xlsData.professores) {
        const nome = profData.nome?.trim();
        if (!nome) {
          result.errors.push('Professor sem nome encontrado');
          continue;
        }

        try {
          // Buscar professor por nome em TODAS as unidades
          const { data: existingProfs, error: searchError } = await supabase
            .from('professores')
            .select('id, unit_id, status')
            .eq('nome', nome);

          if (searchError) {
            result.errors.push(`Erro ao buscar professor ${nome}: ${searchError.message}`);
            continue;
          }

          let professorProcessado = false;

          if (existingProfs && existingProfs.length > 0) {
            // Verificar se já existe na unidade atual
            const profNaUnidadeAtual = existingProfs.find(p => p.unit_id === MARINGA_UNIT_ID);
            const profEmOutraUnidade = existingProfs.find(p => p.unit_id !== MARINGA_UNIT_ID);
            
            if (profNaUnidadeAtual) {
              // Professor já existe na unidade atual, apenas reativar
              const { error: updateError } = await supabase
                .from('professores')
                .update({ 
                  status: true, 
                  slack_username: profData.slack_username || null,
                  ultima_sincronizacao: new Date().toISOString()
                })
                .eq('id', profNaUnidadeAtual.id);

              if (updateError) {
                result.errors.push(`Erro ao reativar professor ${nome}: ${updateError.message}`);
              } else {
                result.professores_reativados++;
                console.log(`Professor reativado: ${nome}`);
              }
              professorProcessado = true;
            } else if (profEmOutraUnidade) {
              // Professor existe em outra unidade, mover para unidade atual
              const { error: updateError } = await supabase
                .from('professores')
                .update({ 
                  unit_id: MARINGA_UNIT_ID,
                  status: true, 
                  slack_username: profData.slack_username || null,
                  ultima_sincronizacao: new Date().toISOString()
                })
                .eq('id', profEmOutraUnidade.id);

              if (updateError) {
                result.errors.push(`Erro ao mover professor ${nome}: ${updateError.message}`);
              } else {
                result.professores_reativados++;
                console.log(`Professor movido para unidade atual: ${nome}`);
              }
              professorProcessado = true;
            }
            
            // Remover duplicatas se existirem
            if (existingProfs.length > 1) {
              const profParaManter = profNaUnidadeAtual || profEmOutraUnidade;
              const profsParaRemover = existingProfs.filter(p => p.id !== profParaManter.id);
              
              for (const profDuplicado of profsParaRemover) {
                const { error: deleteError } = await supabase
                  .from('professores')
                  .delete()
                  .eq('id', profDuplicado.id);
                
                if (deleteError) {
                  console.error('Erro ao remover duplicata:', deleteError);
                } else {
                  console.log(`Professor duplicado removido: ${nome} (ID: ${profDuplicado.id})`);
                }
              }
            }
          }

          // Se não foi processado, criar novo professor
          if (!professorProcessado) {
            const { error: insertError } = await supabase
              .from('professores')
              .insert({
                nome,
                slack_username: profData.slack_username || null,
                unit_id: MARINGA_UNIT_ID,
                status: true,
                ultima_sincronizacao: new Date().toISOString()
              });

            if (insertError) {
              result.errors.push(`Erro ao criar professor ${nome}: ${insertError.message}`);
            } else {
              result.professores_criados++;
              console.log(`Professor criado: ${nome}`);
            }
          }
        } catch (error) {
          result.errors.push(`Erro ao processar professor ${nome}: ${error.message}`);
        }
      }
    }

    // ETAPA 3: Processar Turmas
    console.log('Etapa 3: Processando turmas...');
    if (xlsData.turmas && xlsData.turmas.length > 0) {
      for (const turmaData of xlsData.turmas) {
        const nome = turmaData.nome?.trim();
        const professorNome = turmaData.professor_nome?.trim();
        
        if (!nome || !professorNome) {
          result.errors.push('Turma sem nome ou professor encontrada');
          continue;
        }

        try {
          // Buscar professor por nome
          const { data: professor, error: profSearchError } = await supabase
            .from('professores')
            .select('id')
            .eq('nome', professorNome)
            .eq('unit_id', MARINGA_UNIT_ID)
            .eq('status', true)
            .maybeSingle();

          if (profSearchError) {
            result.errors.push(`Erro ao buscar professor ${professorNome}: ${profSearchError.message}`);
            continue;
          }

          if (!professor) {
            result.errors.push(`Professor ${professorNome} não encontrado para turma ${nome}`);
            continue;
          }

          // Validar dia da semana
          const diaSemanaValidos = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
          const diaSemana = turmaData.dia_semana?.toLowerCase()?.trim();
          
          if (!diaSemana || !diaSemanaValidos.includes(diaSemana)) {
            result.errors.push(`Dia da semana inválido para turma ${nome}: ${turmaData.dia_semana}`);
            continue;
          }

          // Buscar turma existente por nome (case sensitive)
          const { data: existingTurma, error: turmaSearchError } = await supabase
            .from('turmas')
            .select('id')
            .eq('nome', nome)
            .eq('unit_id', MARINGA_UNIT_ID)
            .maybeSingle();

          if (turmaSearchError) {
            result.errors.push(`Erro ao buscar turma ${nome}: ${turmaSearchError.message}`);
            continue;
          }

          if (existingTurma) {
            // Reativar turma existente
            const { error: updateError } = await supabase
              .from('turmas')
              .update({
                professor_id: professor.id,
                dia_semana: diaSemana as any,
                sala: turmaData.sala || null,
                horario_inicio: turmaData.horario_inicio || null,
                active: true,
                ultima_sincronizacao: new Date().toISOString()
              })
              .eq('id', existingTurma.id);

            if (updateError) {
              result.errors.push(`Erro ao reativar turma ${nome}: ${updateError.message}`);
            } else {
              result.turmas_reativadas++;
              console.log(`Turma reativada: ${nome}`);
            }
          } else {
            // Criar nova turma
            const { error: insertError } = await supabase
              .from('turmas')
              .insert({
                nome,
                professor_id: professor.id,
                dia_semana: diaSemana as any,
                sala: turmaData.sala || null,
                horario_inicio: turmaData.horario_inicio || null,
                unit_id: MARINGA_UNIT_ID,
                active: true,
                ultima_sincronizacao: new Date().toISOString()
              });

            if (insertError) {
              result.errors.push(`Erro ao criar turma ${nome}: ${insertError.message}`);
            } else {
              result.turmas_criadas++;
              console.log(`Turma criada: ${nome}`);
            }
          }
        } catch (error) {
          result.errors.push(`Erro ao processar turma ${nome}: ${error.message}`);
        }
      }
    }

    // ETAPA 4: Processar Alunos
    console.log('Etapa 4: Processando alunos...');
    if (xlsData.alunos && xlsData.alunos.length > 0) {
      for (const alunoData of xlsData.alunos) {
        const nome = alunoData.nome?.trim();
        const turmaNome = alunoData.turma_atual?.trim();
        
        if (!nome) {
          result.errors.push('Aluno sem nome encontrado');
          continue;
        }

        try {
          let turmaId = null;
          
          // Buscar turma por nome se especificado
          if (turmaNome) {
            const { data: turma, error: turmaSearchError } = await supabase
              .from('turmas')
              .select('id')
              .eq('nome', turmaNome)
              .eq('unit_id', MARINGA_UNIT_ID)
              .eq('active', true)
              .maybeSingle();

            if (turmaSearchError) {
              result.errors.push(`Erro ao buscar turma ${turmaNome} para aluno ${nome}: ${turmaSearchError.message}`);
              continue;
            }

            if (!turma) {
              result.errors.push(`Turma ${turmaNome} não encontrada para aluno ${nome}`);
              continue;
            }

            turmaId = turma.id;
          }

          // Buscar aluno existente por nome (case sensitive)
          const { data: existingAluno, error: alunoSearchError } = await supabase
            .from('alunos')
            .select('id')
            .eq('nome', nome)
            .eq('unit_id', MARINGA_UNIT_ID)
            .maybeSingle();

          if (alunoSearchError) {
            result.errors.push(`Erro ao buscar aluno ${nome}: ${alunoSearchError.message}`);
            continue;
          }

          // Preparar dados do aluno (mapeamento de campos)
          const alunoUpdate = {
            nome,
            telefone: alunoData.telefone || null,
            email: alunoData.email || null,
            matricula: alunoData.matricula || null,
            turma_id: turmaId,
            idade: alunoData.idade ? parseInt(alunoData.idade) : null,
            ultimo_nivel: alunoData.ultimo_nivel || null,
            dias_apostila: alunoData.dias_apostila ? parseInt(alunoData.dias_apostila) : null,
            dias_supera: alunoData.dias_supera ? parseInt(alunoData.dias_supera) : null,
            vencimento_contrato: alunoData.vencimento_contrato || null,
            active: true,
            ultima_sincronizacao: new Date().toISOString()
          };

          if (existingAluno) {
            // Reativar e atualizar aluno existente
            const { error: updateError } = await supabase
              .from('alunos')
              .update(alunoUpdate)
              .eq('id', existingAluno.id);

            if (updateError) {
              result.errors.push(`Erro ao reativar aluno ${nome}: ${updateError.message}`);
            } else {
              result.alunos_reativados++;
              console.log(`Aluno reativado: ${nome}`);
            }
          } else {
            // Criar novo aluno
            const { error: insertError } = await supabase
              .from('alunos')
              .insert({
                ...alunoUpdate,
                unit_id: MARINGA_UNIT_ID
              });

            if (insertError) {
              result.errors.push(`Erro ao criar aluno ${nome}: ${insertError.message}`);
            } else {
              result.alunos_criados++;
              console.log(`Aluno criado: ${nome}`);
            }
          }
        } catch (error) {
          result.errors.push(`Erro ao processar aluno ${nome}: ${error.message}`);
        }
      }
    }

    console.log('Sincronização completa finalizada:', result);

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
        professores_reativados: 0,
        professores_criados: 0,
        turmas_reativadas: 0,
        turmas_criadas: 0,
        alunos_reativados: 0,
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
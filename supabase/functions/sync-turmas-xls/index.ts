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

  let importId: string | null = null;
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { xlsData, fileName, unitId }: { xlsData: XlsData; fileName: string; unitId: string } = await req.json();

    // Validar unitId obrigatório
    if (!unitId) {
      return new Response(
        JSON.stringify({ error: 'unitId é obrigatório' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    console.log(`Processando arquivo: ${fileName} para unidade: ${unitId}`);
    console.log(`Iniciando sincronização completa - Dados: ${xlsData.professores?.length} professores, ${xlsData.turmas?.length} turmas, ${xlsData.alunos?.length} alunos`);

    // Calcular total de registros
    const totalRows = (xlsData.professores?.length || 0) + (xlsData.turmas?.length || 0) + (xlsData.alunos?.length || 0);
    
    // Criar registro inicial na tabela data_imports
    const { data: importRecord, error: importError } = await supabase
      .from('data_imports')
      .insert({
        import_type: 'turmas-xls',
        file_name: fileName,
        status: 'processing',
        unit_id: unitId,
        total_rows: totalRows,
        processed_rows: 0
      })
      .select()
      .single();

    if (importError) {
      console.error('Erro ao criar registro de importação:', importError);
      throw new Error(`Falha ao iniciar rastreamento da sincronização: ${importError.message}`);
    }

    importId = importRecord.id;
    console.log(`Registro de importação criado: ${importId}`);

    const result: ProcessResult = {
      professores_reativados: 0,
      professores_criados: 0,
      turmas_reativadas: 0,
      turmas_criadas: 0,
      alunos_reativados: 0,
      alunos_criados: 0,
      errors: []
    };

    let processedRows = 0;

    // Função auxiliar para atualizar progresso
    const updateProgress = async (increment = 1) => {
      processedRows += increment;
      
      if (processedRows % 10 === 0 || processedRows === totalRows) {
        await supabase
          .from('data_imports')
          .update({ processed_rows: processedRows })
          .eq('id', importId);
        
        console.log(`Progresso: ${processedRows}/${totalRows} registros processados`);
      }
    };

    // ETAPA 1: Desativar todos os registros da unidade
    console.log('Etapa 1: Desativando todos os registros existentes...');
    
    const { error: profDeactivateError } = await supabase
      .from('professores')
      .update({ status: false })
      .eq('unit_id', unitId);

    if (profDeactivateError) {
      result.errors.push(`Erro ao desativar professores: ${profDeactivateError.message}`);
    }

    const { error: turmasDeactivateError } = await supabase
      .from('turmas')
      .update({ active: false })
      .eq('unit_id', unitId);

    if (turmasDeactivateError) {
      result.errors.push(`Erro ao desativar turmas: ${turmasDeactivateError.message}`);
    }

    const { error: alunosDeactivateError } = await supabase
      .from('alunos')
      .update({ active: false })
      .eq('unit_id', unitId);

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
          await updateProgress();
          continue;
        }

        try {
          const { data: existingProfs, error: searchError } = await supabase
            .from('professores')
            .select('id, unit_id, status')
            .ilike('nome', nome);

          if (searchError) {
            result.errors.push(`Erro ao buscar professor ${nome}: ${searchError.message}`);
            await updateProgress();
            continue;
          }

          console.log(`Buscando professor: ${nome}, encontrados: ${existingProfs?.length || 0}`);

          let professorProcessado = false;

          if (existingProfs && existingProfs.length > 0) {
            const profNaUnidadeAtual = existingProfs.find(p => p.unit_id === unitId);
            const profEmOutraUnidade = existingProfs.find(p => p.unit_id !== unitId);
            
            if (profNaUnidadeAtual) {
              const { error: updateError } = await supabase
                .from('professores')
                .update({ 
                  status: true, 
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
              const { error: updateError } = await supabase
                .from('professores')
                .update({ 
                  unit_id: unitId,
                  status: true, 
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

          if (!professorProcessado) {
            const { error: insertError } = await supabase
              .from('professores')
              .insert({
                nome,
                unit_id: unitId,
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
          
          await updateProgress();
        } catch (error) {
          result.errors.push(`Erro ao processar professor ${nome}: ${error.message}`);
          await updateProgress();
        }
      }
    }

    // ETAPA 3: Processar Turmas
    console.log('Etapa 3: Processando turmas...');
    if (xlsData.turmas && xlsData.turmas.length > 0) {
      for (const turmaData of xlsData.turmas) {
        const nome = turmaData.nome?.trim();
        const professorNome = turmaData.professor_nome?.trim();
        
        console.log(`Processando turma: ${nome}, Professor: ${professorNome}`);
        
        if (!nome || !professorNome) {
          result.errors.push('Turma sem nome ou professor encontrada');
          await updateProgress();
          continue;
        }

        try {
          const { data: professor, error: profSearchError } = await supabase
            .from('professores')
            .select('id')
            .eq('nome', professorNome)
            .eq('unit_id', unitId)
            .eq('status', true)
            .maybeSingle();

          console.log(`Professor encontrado para turma ${nome}:`, professor);

          if (profSearchError) {
            result.errors.push(`Erro ao buscar professor ${professorNome}: ${profSearchError.message}`);
            await updateProgress();
            continue;
          }

          if (!professor) {
            result.errors.push(`Professor ${professorNome} não encontrado para turma ${nome}`);
            await updateProgress();
            continue;
          }

          let diaSemana = 'segunda';
          const nomeLower = nome.toLowerCase();
          
          if (nomeLower.includes('2ª') || nomeLower.includes('segunda')) {
            diaSemana = 'segunda';
          } else if (nomeLower.includes('3ª') || nomeLower.includes('terca')) {
            diaSemana = 'terca';
          } else if (nomeLower.includes('4ª') || nomeLower.includes('quarta')) {
            diaSemana = 'quarta';
          } else if (nomeLower.includes('5ª') || nomeLower.includes('quinta')) {
            diaSemana = 'quinta';
          } else if (nomeLower.includes('6ª') || nomeLower.includes('sexta')) {
            diaSemana = 'sexta';
          } else if (nomeLower.includes('sábado') || nomeLower.includes('sabado')) {
            diaSemana = 'sabado';
          }

          console.log(`Dia da semana extraído para turma ${nome}: ${diaSemana}`);

          const { data: existingTurma, error: turmaSearchError } = await supabase
            .from('turmas')
            .select('id')
            .eq('nome', nome)
            .eq('unit_id', unitId)
            .maybeSingle();

          console.log(`Turma existente encontrada:`, existingTurma);

          if (turmaSearchError) {
            result.errors.push(`Erro ao buscar turma ${nome}: ${turmaSearchError.message}`);
            await updateProgress();
            continue;
          }

          if (existingTurma) {
            const { error: updateError } = await supabase
              .from('turmas')
              .update({
                professor_id: professor.id,
                dia_semana: diaSemana as any,
                sala: turmaData.sala || null,
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
            const { error: insertError } = await supabase
              .from('turmas')
              .insert({
                nome,
                professor_id: professor.id,
                dia_semana: diaSemana as any,
                sala: turmaData.sala || null,
                unit_id: unitId,
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
          
          await updateProgress();
        } catch (error) {
          result.errors.push(`Erro ao processar turma ${nome}: ${error.message}`);
          await updateProgress();
        }
      }
    }

    // ETAPA 4: Processar Alunos
    console.log('Etapa 4: Processando alunos...');
    if (xlsData.alunos && xlsData.alunos.length > 0) {
      for (const alunoData of xlsData.alunos) {
        const nome = alunoData.nome?.trim();
        const turmaNome = alunoData.turma_atual?.trim();
        
        console.log(`Processando aluno: ${nome}, Turma: ${turmaNome}`);
        
        if (!nome) {
          result.errors.push('Aluno sem nome encontrado');
          await updateProgress();
          continue;
        }

        try {
          let turmaId = null;
          
          if (turmaNome) {
            const { data: turma, error: turmaSearchError } = await supabase
              .from('turmas')
              .select('id')
              .eq('nome', turmaNome)
              .eq('unit_id', unitId)
              .eq('active', true)
              .maybeSingle();

            console.log(`Turma encontrada para aluno ${nome}:`, turma);

            if (turmaSearchError) {
              result.errors.push(`Erro ao buscar turma ${turmaNome} para aluno ${nome}: ${turmaSearchError.message}`);
              await updateProgress();
              continue;
            }

            if (!turma) {
              result.errors.push(`Turma ${turmaNome} não encontrada para aluno ${nome}`);
              await updateProgress();
              continue;
            }

            turmaId = turma.id;
          }

          const { data: existingAluno, error: alunoSearchError } = await supabase
            .from('alunos')
            .select('id')
            .eq('nome', nome)
            .eq('unit_id', unitId)
            .maybeSingle();

          console.log(`Aluno existente encontrado:`, existingAluno);

          if (alunoSearchError) {
            result.errors.push(`Erro ao buscar aluno ${nome}: ${alunoSearchError.message}`);
            await updateProgress();
            continue;
          }

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

          console.log(`Dados do aluno preparados:`, alunoUpdate);

          if (existingAluno) {
            const { error: updateError } = await supabase
              .from('alunos')
              .update(alunoUpdate)
              .eq('id', existingAluno.id);

            if (updateError) {
              result.errors.push(`Erro ao reativar aluno ${nome}: ${updateError.message}`);
              console.error(`Erro ao reativar aluno ${nome}:`, updateError);
            } else {
              result.alunos_reativados++;
              console.log(`Aluno reativado: ${nome}`);
            }
          } else {
            const { error: insertError } = await supabase
              .from('alunos')
              .insert({
                ...alunoUpdate,
                unit_id: unitId
              });

            if (insertError) {
              result.errors.push(`Erro ao criar aluno ${nome}: ${insertError.message}`);
              console.error(`Erro ao criar aluno ${nome}:`, insertError);
            } else {
              result.alunos_criados++;
              console.log(`Aluno criado: ${nome}`);
            }
          }
          
          await updateProgress();
        } catch (error) {
          result.errors.push(`Erro ao processar aluno ${nome}: ${error.message}`);
          console.error(`Erro ao processar aluno ${nome}:`, error);
          await updateProgress();
        }
      }
    }

    console.log('Sincronização completa finalizada:', result);

    // ETAPA 5: Enviar alunos ativos para webhook (fire-and-forget)
    const webhookUrl = Deno.env.get('WEBHOOK_ALUNOS_ATIVOS_URL');
    
    if (webhookUrl) {
      console.log('Etapa 5: Enviando alunos ativos para webhook...');
      
      (async () => {
        try {
          const { data: alunosAtivos, error: alunosError } = await supabase
            .from('alunos')
            .select(`
              id,
              nome,
              telefone,
              email,
              turma_id,
              turmas (
                nome,
                professores (
                  nome
                )
              )
            `)
            .eq('unit_id', unitId)
            .eq('active', true)
            .order('nome');

          if (alunosError) {
            console.error('❌ Erro ao buscar alunos ativos para webhook:', alunosError);
            return;
          }

          const webhookPayload = {
            tipo_evento: 'sincronizacao_concluida',
            data_evento: new Date().toISOString(),
            unidade_id: unitId,
            arquivo: fileName,
            estatisticas: {
              total_alunos_ativos: alunosAtivos?.length || 0,
              professores_criados: result.professores_criados,
              professores_reativados: result.professores_reativados,
              turmas_criadas: result.turmas_criadas,
              turmas_reativadas: result.turmas_reativadas,
              alunos_criados: result.alunos_criados,
              alunos_reativados: result.alunos_reativados
            },
            alunos: (alunosAtivos || []).map((aluno: any) => ({
              id: aluno.id,
              nome: aluno.nome,
              telefone: aluno.telefone || null,
              email: aluno.email || null,
              turma: aluno.turmas?.nome || null,
              professor: aluno.turmas?.professores?.nome || null
            }))
          };

          console.log(`📤 Enviando ${alunosAtivos?.length || 0} alunos ativos para webhook...`);

          fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookPayload),
          });

          console.log('📨 Webhook disparado em background (não aguardando resposta)');

        } catch (webhookError) {
          console.error('❌ Erro ao processar webhook:', webhookError);
        }
      })();
      
      console.log('📨 Webhook disparado em background (não aguardando resposta)');
    } else {
      console.log('⚠️ URL do webhook não configurada (WEBHOOK_ALUNOS_ATIVOS_URL)');
    }

    // Finalizar registro de importação como sucesso
    await supabase
      .from('data_imports')
      .update({
        status: 'completed',
        processed_rows: totalRows,
        error_log: result.errors.length > 0 ? { 
          errors: result.errors,
          summary: result
        } : null
      })
      .eq('id', importId);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Erro geral:', error);
    
    if (importId) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        await supabase
          .from('data_imports')
          .update({
            status: 'failed',
            error_log: {
              error: error.message,
              stack: error.stack
            }
          })
          .eq('id', importId);
      } catch (updateError) {
        console.error('Erro ao atualizar status de falha:', updateError);
      }
    }
    
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

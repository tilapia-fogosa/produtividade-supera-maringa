
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { ProdutividadeData } from './types.ts';

// Função para criar o cliente Supabase
export function createSupabaseClient(authHeader: string) {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );
}

// Função para registrar dados do aluno no banco de dados
export async function registrarDadosAluno(
  supabaseClient: any, 
  data: ProdutividadeData
): Promise<boolean> {
  try {
    // Atualizar dados do aluno se presente e com apostila e página
    if (data.presente && data.apostila_atual && data.ultima_pagina) {
      console.log('Atualizando dados do aluno:', {
        ultimo_nivel: data.apostila_atual,
        ultima_pagina: data.ultima_pagina,
        ultima_correcao_ah: data.data_ultima_correcao_ah
      });
      
      const { error: updateError } = await supabaseClient
        .from('alunos')
        .update({ 
          ultima_correcao_ah: data.data_ultima_correcao_ah,
          ultimo_nivel: data.apostila_atual,
          ultima_pagina: data.ultima_pagina 
        })
        .eq('id', data.aluno_id);

      if (updateError) {
        console.error('Erro ao atualizar dados do aluno:', updateError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao registrar dados do aluno:", error);
    return false;
  }
}

// Função para inserir dados de produtividade no banco de dados
export async function registrarProdutividade(
  supabaseClient: any,
  data: ProdutividadeData
): Promise<boolean> {
  try {
    console.log('Registrando produtividade para aluno:', data.aluno_id);
    
    // Registrar na tabela de presença
    // Permitindo múltiplos registros por dia (removendo a validação que impedia isso)
    if (data.presente !== undefined) {
      console.log(`Registrando ${data.presente ? 'presença' : 'falta'} para o aluno:`, data.aluno_id);
      
      const { error: presencaError } = await supabaseClient
        .from('presencas')
        .insert({
          aluno_id: data.aluno_id,
          data_aula: data.data_registro,
          presente: data.presente,
          observacao: data.motivo_falta,
          is_reposicao: data.is_reposicao || false
        });
      
      if (presencaError) {
        console.error('Erro ao registrar presença:', presencaError);
        return false;
      }
      
      // Se for falta, registrar na tabela de faltas
      if (!data.presente && data.motivo_falta) {
        console.log('Registrando falta com motivo para o aluno:', data.aluno_id);
        
        const { error: faltaError } = await supabaseClient
          .from('faltas_alunos')
          .insert({
            aluno_id: data.aluno_id,
            data_falta: data.data_registro,
            motivo: data.motivo_falta
          });
        
        if (faltaError) {
          console.error('Erro ao registrar falta:', faltaError);
          return false;
        }
      }
    }
    
    // Se aluno estiver presente, registrar produtividade do ábaco
    // Permitindo múltiplos registros por dia (removendo a validação que impedia isso)
    if (data.presente) {
      console.log('Registrando produtividade do ábaco para o aluno:', data.aluno_id);
      
      // Usar apostila_abaco se fornecida, caso contrário usar a apostila_atual
      const apostilaFinal = data.apostila_abaco || data.apostila_atual;
      
      // Se ainda assim não tiver uma apostila, buscar da tabela de alunos
      let apostila = apostilaFinal;
      let pagina = data.pagina_abaco || data.ultima_pagina;
      
      if (!apostila) {
        console.log('Apostila não fornecida, buscando dados do aluno...');
        const { data: alunoData, error: alunoError } = await supabaseClient
          .from('alunos')
          .select('ultimo_nivel, ultima_pagina')
          .eq('id', data.aluno_id)
          .single();
          
        if (!alunoError && alunoData) {
          apostila = alunoData.ultimo_nivel;
          if (!pagina) {
            pagina = alunoData.ultima_pagina?.toString();
          }
          console.log('Dados recuperados do aluno:', { apostila, pagina });
        } else if (alunoError) {
          console.error('Erro ao buscar dados do aluno:', alunoError);
        }
      }
      
      if (!apostila) {
        console.warn('Não foi possível determinar a apostila do aluno. Usando valor padrão.');
        apostila = 'Não especificada';
      }
      
      const produtividadeData = {
        aluno_id: data.aluno_id,
        data_aula: data.data_registro,
        presente: data.presente,
        is_reposicao: data.is_reposicao || false,
        apostila: apostila,
        pagina: pagina,
        exercicios: data.exercicios_abaco ? parseInt(data.exercicios_abaco) : null,
        erros: data.erros_abaco ? parseInt(data.erros_abaco) : null,
        fez_desafio: data.fez_desafio || false,
        comentario: data.comentario
      };
      
      console.log('Dados de produtividade a salvar:', produtividadeData);
      
      const { error: produtividadeError } = await supabaseClient
        .from('produtividade_abaco')
        .insert(produtividadeData);
      
      if (produtividadeError) {
        console.error('Erro ao registrar produtividade ábaco:', produtividadeError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao registrar produtividade:", error);
    return false;
  }
}

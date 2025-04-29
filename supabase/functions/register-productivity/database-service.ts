
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
    if (data.presente) {
      const updateData: any = {};
      
      // Verificar se há dados da apostila e página para atualizar
      if (data.apostila_abaco) {
        updateData.ultimo_nivel = data.apostila_abaco;
        console.log('Atualizando último nível do aluno para:', data.apostila_abaco);
      } else if (data.apostila_atual) {
        updateData.ultimo_nivel = data.apostila_atual;
        console.log('Usando apostila_atual:', data.apostila_atual);
      }
      
      // Verificar se há dados da página para atualizar
      if (data.pagina_abaco) {
        updateData.ultima_pagina = data.pagina_abaco;
        console.log('Atualizando última página do aluno para:', data.pagina_abaco);
      } else if (data.ultima_pagina) {
        updateData.ultima_pagina = data.ultima_pagina;
        console.log('Usando ultima_pagina existente:', data.ultima_pagina);
      }
      
      // Adicionar última correção AH, se houver
      if (data.data_ultima_correcao_ah) {
        updateData.ultima_correcao_ah = data.data_ultima_correcao_ah;
      }
      
      // Adicionar nível do desafio, se houver e se fez desafio
      if (data.fez_desafio && data.nivel_desafio) {
        updateData.niveldesafio = data.nivel_desafio;
        console.log('Atualizando nível de desafio do aluno para:', data.nivel_desafio);
      }
      
      // Só atualiza se houver algum dado para atualizar
      if (Object.keys(updateData).length > 0) {
        console.log('Atualizando dados do aluno:', updateData);
        
        const { error: updateError } = await supabaseClient
          .from('alunos')
          .update(updateData)
          .eq('id', data.aluno_id);

        if (updateError) {
          console.error('Erro ao atualizar dados do aluno:', updateError);
          return false;
        }
        
        console.log('Dados do aluno atualizados com sucesso!');
      } else {
        console.log('Nenhum dado para atualizar na tabela alunos');
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
    
    // Se aluno estiver presente, registrar produtividade do ábaco
    if (data.presente !== undefined) {
      console.log(`Registrando ${data.presente ? 'presença' : 'falta'} para o aluno:`, data.aluno_id);
      
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
        data_aula: data.data_aula || data.data_registro,
        presente: data.presente,
        is_reposicao: data.is_reposicao || false,
        apostila: apostila,
        pagina: pagina,
        exercicios: data.exercicios_abaco ? parseInt(data.exercicios_abaco) : null,
        erros: data.erros_abaco ? parseInt(data.erros_abaco) : null,
        fez_desafio: data.fez_desafio || false,
        comentario: data.motivo_falta || data.comentario // Usando motivo_falta como comentário se existir
      };
      
      console.log('Dados de produtividade a salvar:', produtividadeData);
      
      const { error: produtividadeError } = await supabaseClient
        .from('produtividade_abaco')
        .insert(produtividadeData);
      
      if (produtividadeError) {
        console.error('Erro ao registrar produtividade ábaco:', produtividadeError);
        console.error('Detalhes do erro produtividade:', JSON.stringify(produtividadeError));
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao registrar produtividade:", error);
    return false;
  }
}

// Nova função para excluir registro de produtividade
export async function excluirProdutividade(
  supabaseClient: any,
  registroId: string
): Promise<boolean> {
  try {
    console.log('Excluindo registro de produtividade:', registroId);
    
    const { error } = await supabaseClient
      .from('produtividade_abaco')
      .delete()
      .eq('id', registroId);
    
    if (error) {
      console.error('Erro ao excluir produtividade:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao excluir produtividade:", error);
    return false;
  }
}

// Nova função para atualizar registro de produtividade
export async function atualizarProdutividade(
  supabaseClient: any,
  data: any
): Promise<boolean> {
  try {
    console.log('Atualizando registro de produtividade:', data.id);
    
    // Primeiro atualiza o registro de produtividade
    const { error } = await supabaseClient
      .from('produtividade_abaco')
      .update({
        presente: data.presente,
        apostila: data.apostila,
        pagina: data.pagina,
        exercicios: data.exercicios ? parseInt(data.exercicios) : null,
        erros: data.erros ? parseInt(data.erros) : null,
        fez_desafio: data.fez_desafio,
        comentario: data.comentario,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.id);
    
    if (error) {
      console.error('Erro ao atualizar produtividade:', error);
      return false;
    }
    
    // Em seguida, também atualiza os dados do aluno se necessário
    if (data.presente && data.apostila && data.pagina) {
      const updateData = {
        ultimo_nivel: data.apostila,
        ultima_pagina: data.pagina
      };
      
      console.log('Atualizando dados do aluno após edição:', updateData);
      
      const { error: updateError } = await supabaseClient
        .from('alunos')
        .update(updateData)
        .eq('id', data.aluno_id);
        
      if (updateError) {
        console.error('Erro ao atualizar dados do aluno após edição:', updateError);
        // Não falha completamente se apenas a atualização do aluno falhar
      } else {
        console.log('Dados do aluno atualizados com sucesso após edição!');
      }
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao atualizar produtividade:", error);
    return false;
  }
}


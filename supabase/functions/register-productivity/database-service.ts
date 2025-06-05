import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { ProdutividadeData } from './types.ts';

export function createSupabaseClient(authorizationHeader: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    global: {
      headers: {
        Authorization: authorizationHeader,
      },
    },
  });
  
  return supabase;
}

export async function registrarDadosAluno(supabaseClient: any, data: ProdutividadeData): Promise<boolean> {
  try {
    console.log('=== REGISTRAR DADOS ALUNO ===');
    console.log('Verificando se é aluno ou funcionário para pessoa_id:', data.pessoa_id);
    
    // Primeiro verificar se é um aluno
    const { data: alunoExiste, error: alunoError } = await supabaseClient
      .from('alunos')
      .select('id')
      .eq('id', data.pessoa_id)
      .maybeSingle();
    
    if (alunoError) {
      console.error('Erro ao verificar aluno:', alunoError);
      return false;
    }
    
    console.log('Resultado da verificação de aluno:', { encontrado: !!alunoExiste, dados: alunoExiste });
    
    if (alunoExiste) {
      console.log('Encontrado como aluno, atualizando dados...');
      
      const updateData: any = {};
      if (data.apostila_atual) {
        updateData.ultimo_nivel = data.apostila_atual;
        console.log('Atualizando último nível do aluno para:', data.apostila_atual);
      }
      if (data.ultima_pagina) {
        updateData.ultima_pagina = parseInt(data.ultima_pagina);
        console.log('Atualizando última página do aluno para:', data.ultima_pagina);
      }
      if (data.data_ultima_correcao_ah) {
        updateData.ultima_correcao_ah = data.data_ultima_correcao_ah;
        console.log('Atualizando última correção AH para:', data.data_ultima_correcao_ah);
      }
      
      if (Object.keys(updateData).length > 0) {
        console.log('Dados a atualizar no aluno:', updateData);
        
        const { error: updateError } = await supabaseClient
          .from('alunos')
          .update(updateData)
          .eq('id', data.pessoa_id);
        
        if (updateError) {
          console.error('Erro ao atualizar dados do aluno:', updateError);
          return false;
        }
        
        console.log('Dados do aluno atualizados com sucesso!');
      } else {
        console.log('Nenhum dado para atualizar no aluno');
      }
      
      return true;
    }
    
    // Se não é aluno, verificar se é funcionário
    console.log('Não encontrado como aluno, verificando se é funcionário...');
    const { data: funcionarioExiste, error: funcionarioError } = await supabaseClient
      .from('funcionarios')
      .select('id')
      .eq('id', data.pessoa_id)
      .maybeSingle();
    
    if (funcionarioError) {
      console.error('Erro ao verificar funcionário:', funcionarioError);
      return false;
    }
    
    console.log('Resultado da verificação de funcionário:', { encontrado: !!funcionarioExiste, dados: funcionarioExiste });
    
    if (funcionarioExiste) {
      console.log('Encontrado como funcionário, atualizando dados...');
      
      const updateData: any = {};
      if (data.apostila_atual) updateData.ultimo_nivel = data.apostila_atual;
      if (data.ultima_pagina) updateData.ultima_pagina = parseInt(data.ultima_pagina);
      if (data.data_ultima_correcao_ah) updateData.ultima_correcao_ah = data.data_ultima_correcao_ah;
      
      if (Object.keys(updateData).length > 0) {
        console.log('Atualizando dados do funcionário:', updateData);
        
        const { error: updateError } = await supabaseClient
          .from('funcionarios')
          .update(updateData)
          .eq('id', data.pessoa_id);
        
        if (updateError) {
          console.error('Erro ao atualizar dados do funcionário:', updateError);
          return false;
        }
        
        console.log('Dados do funcionário atualizados com sucesso!');
      }
      
      return true;
    }
    
    console.error('ID não encontrado nem em alunos nem em funcionários:', data.pessoa_id);
    return false;
    
  } catch (error) {
    console.error('Erro geral ao registrar dados:', error);
    return false;
  }
}

export async function registrarProdutividade(supabaseClient: any, data: ProdutividadeData): Promise<boolean> {
  try {
    console.log('=== REGISTRAR PRODUTIVIDADE ===');
    console.log('Registrando produtividade para pessoa_id:', data.pessoa_id);
    
    // Verificar se é aluno ou funcionário antes de inserir
    console.log('Verificando se pessoa existe em alunos...');
    const { data: alunoExiste, error: alunoCheckError } = await supabaseClient
      .from('alunos')
      .select('id')
      .eq('id', data.pessoa_id)
      .maybeSingle();
    
    if (alunoCheckError) {
      console.error('Erro ao verificar aluno:', alunoCheckError);
    }
    
    console.log('Verificando se pessoa existe em funcionários...');
    const { data: funcionarioExiste, error: funcionarioCheckError } = await supabaseClient
      .from('funcionarios')
      .select('id')
      .eq('id', data.pessoa_id)
      .maybeSingle();
    
    if (funcionarioCheckError) {
      console.error('Erro ao verificar funcionário:', funcionarioCheckError);
    }
    
    console.log('Resultados da verificação:', { 
      alunoExiste: !!alunoExiste, 
      funcionarioExiste: !!funcionarioExiste 
    });
    
    if (!alunoExiste && !funcionarioExiste) {
      console.error('ID não encontrado nem em alunos nem em funcionários');
      return false;
    }
    
    const tipoPessoa = alunoExiste ? 'aluno' : 'funcionario';
    console.log('Registrando presença para o', tipoPessoa + ':', data.pessoa_id);
    
    // Preparar dados para inserção usando os novos campos
    const produtividadeData = {
      pessoa_id: data.pessoa_id,
      tipo_pessoa: tipoPessoa,
      data_aula: data.data_aula,
      presente: data.presente,
      is_reposicao: data.is_reposicao || false,
      apostila: data.apostila_abaco || null,
      pagina: data.pagina_abaco || null,
      exercicios: data.exercicios_abaco ? parseInt(data.exercicios_abaco) : null,
      erros: data.erros_abaco ? parseInt(data.erros_abaco) : null,
      fez_desafio: data.fez_desafio || false,
      comentario: data.comentario || '',
      motivo_falta: data.motivo_falta || null
    };
    
    console.log('Dados de produtividade preparados para inserção:', produtividadeData);
    
    // Verificar se a tabela produtividade_abaco existe e quais são seus campos
    console.log('Tentando inserir na tabela produtividade_abaco...');
    
    try {
      // Inserir na tabela produtividade_abaco
      const { data: insertedData, error: produtividadeError } = await supabaseClient
        .from('produtividade_abaco')
        .insert([produtividadeData])
        .select();
      
      if (produtividadeError) {
        console.error('Erro detalhado ao registrar produtividade ábaco:', produtividadeError);
        console.error('Código do erro:', produtividadeError.code);
        console.error('Mensagem:', produtividadeError.message);
        console.error('Detalhes:', produtividadeError.details);
        console.error('Hint:', produtividadeError.hint);
        return false;
      }
      
      console.log('Produtividade registrada com sucesso! Dados inseridos:', insertedData);
      return true;
      
    } catch (insertError) {
      console.error('Erro na inserção (catch):', insertError);
      return false;
    }
    
  } catch (error) {
    console.error('Erro geral ao registrar produtividade:', error);
    return false;
  }
}

export async function excluirProdutividade(supabaseClient: any, registroId: string): Promise<boolean> {
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
    
    console.log('Registro excluído com sucesso!');
    return true;
    
  } catch (error) {
    console.error('Erro geral ao excluir produtividade:', error);
    return false;
  }
}

export async function atualizarProdutividade(supabaseClient: any, data: any): Promise<boolean> {
  try {
    console.log('Atualizando registro de produtividade:', data.id);
    
    const { error } = await supabaseClient
      .from('produtividade_abaco')
      .update({
        presente: data.presente,
        apostila: data.apostila,
        pagina: data.pagina,
        exercicios: data.exercicios,
        erros: data.erros,
        fez_desafio: data.fez_desafio,
        comentario: data.comentario,
        motivo_falta: data.motivo_falta,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.id);
    
    if (error) {
      console.error('Erro ao atualizar produtividade:', error);
      return false;
    }
    
    console.log('Registro atualizado com sucesso!');
    return true;
    
  } catch (error) {
    console.error('Erro geral ao atualizar produtividade:', error);
    return false;
  }
}

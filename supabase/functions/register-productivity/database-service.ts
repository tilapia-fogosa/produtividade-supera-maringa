
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
    console.log('Verificando se é aluno ou funcionário...');
    
    // Primeiro verificar se é um aluno
    const { data: alunoExiste, error: alunoError } = await supabaseClient
      .from('alunos')
      .select('id')
      .eq('id', data.aluno_id)
      .maybeSingle();
    
    if (alunoError) {
      console.error('Erro ao verificar aluno:', alunoError);
      return false;
    }
    
    if (alunoExiste) {
      console.log('Encontrado como aluno, atualizando dados...');
      
      // Se existe como aluno, atualizar os dados
      if (data.apostila_atual) {
        console.log('Atualizando último nível do aluno para:', data.apostila_atual);
      }
      
      if (data.ultima_pagina) {
        console.log('Atualizando última página do aluno para:', data.ultima_pagina);
      }
      
      const updateData: any = {};
      if (data.apostila_atual && data.presente) updateData.ultimo_nivel = data.apostila_atual;
      if (data.ultima_pagina && data.presente) updateData.ultima_pagina = parseInt(data.ultima_pagina);
      if (data.data_ultima_correcao_ah && data.presente) updateData.ultima_correcao_ah = data.data_ultima_correcao_ah;
      
      // Se é uma falta, atualizar a data da última falta
      if (!data.presente) {
        updateData.ultima_falta = data.data_aula;
        console.log('Atualizando última falta para:', data.data_aula);
      }
      
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
      }
      
      return true;
    }
    
    // Se não é aluno, verificar se é funcionário
    const { data: funcionarioExiste, error: funcionarioError } = await supabaseClient
      .from('funcionarios')
      .select('id')
      .eq('id', data.aluno_id)
      .maybeSingle();
    
    if (funcionarioError) {
      console.error('Erro ao verificar funcionário:', funcionarioError);
      return false;
    }
    
    if (funcionarioExiste) {
      console.log('Encontrado como funcionário, atualizando dados...');
      
      const updateData: any = {};
      if (data.apostila_atual && data.presente) updateData.ultimo_nivel = data.apostila_atual;
      if (data.ultima_pagina && data.presente) updateData.ultima_pagina = parseInt(data.ultima_pagina);
      if (data.data_ultima_correcao_ah && data.presente) updateData.ultima_correcao_ah = data.data_ultima_correcao_ah;
      
      // Se é uma falta, atualizar a data da última falta
      if (!data.presente) {
        updateData.ultima_falta = data.data_aula;
        console.log('Atualizando última falta do funcionário para:', data.data_aula);
      }
      
      if (Object.keys(updateData).length > 0) {
        console.log('Atualizando dados do funcionário:', updateData);
        
        const { error: updateError } = await supabaseClient
          .from('funcionarios')
          .update(updateData)
          .eq('id', data.aluno_id);
        
        if (updateError) {
          console.error('Erro ao atualizar dados do funcionário:', updateError);
          return false;
        }
        
        console.log('Dados do funcionário atualizados com sucesso!');
      }
      
      return true;
    }
    
    console.error('ID não encontrado nem em alunos nem em funcionários:', data.aluno_id);
    return false;
    
  } catch (error) {
    console.error('Erro geral ao registrar dados:', error);
    return false;
  }
}

export async function registrarProdutividade(supabaseClient: any, data: ProdutividadeData): Promise<boolean> {
  try {
    console.log('Registrando produtividade para pessoa:', data.aluno_id);
    
    // Verificar se é aluno ou funcionário antes de inserir
    const { data: alunoExiste } = await supabaseClient
      .from('alunos')
      .select('id')
      .eq('id', data.aluno_id)
      .maybeSingle();
    
    const { data: funcionarioExiste } = await supabaseClient
      .from('funcionarios')
      .select('id')
      .eq('id', data.aluno_id)
      .maybeSingle();
    
    if (!alunoExiste && !funcionarioExiste) {
      console.error('ID não encontrado nem em alunos nem em funcionários');
      return false;
    }
    
    const tipoPessoa = alunoExiste ? 'aluno' : 'funcionario';
    console.log('Registrando para o', tipoPessoa + ':', data.aluno_id);
    
    // Preparar dados para inserção usando os novos campos
    const produtividadeData = {
      pessoa_id: data.aluno_id,
      tipo_pessoa: tipoPessoa,
      data_aula: data.data_aula,
      presente: data.presente,
      is_reposicao: data.is_reposicao || false,
      apostila: data.presente ? (data.apostila_abaco || null) : null,
      pagina: data.presente ? (data.pagina_abaco || null) : null,
      exercicios: data.presente && data.exercicios_abaco ? parseInt(data.exercicios_abaco) : null,
      erros: data.presente && data.erros_abaco ? parseInt(data.erros_abaco) : null,
      fez_desafio: data.presente ? (data.fez_desafio || false) : false,
      comentario: data.comentario || '',
      motivo_falta: !data.presente ? (data.motivo_falta || null) : null
    };
    
    console.log('Dados de produtividade a salvar:', produtividadeData);
    
    // Inserir na tabela produtividade_abaco
    const { error: produtividadeError } = await supabaseClient
      .from('produtividade_abaco')
      .insert([produtividadeData]);
    
    if (produtividadeError) {
      console.error('Erro ao registrar produtividade ábaco:', produtividadeError);
      return false;
    }
    
    console.log('Produtividade registrada com sucesso!');
    return true;
    
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

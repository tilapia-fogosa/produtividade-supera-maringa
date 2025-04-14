
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
  data: any
): Promise<boolean> {
  try {
    if (data.presente && data.data_ultima_correcao_ah) {
      const { error: updateError } = await supabaseClient
        .from('alunos')
        .update({ 
          ultima_correcao_ah: data.data_ultima_correcao_ah,
          ultimo_nivel: data.ultimo_nivel,
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

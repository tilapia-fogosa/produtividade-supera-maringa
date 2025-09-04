
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ProdutividadeAH {
  aluno_id: string;
  apostila: string;
  exercicios: number;
  erros: number;
  professor_correcao: string;
  comentario?: string;
  data_fim_correcao?: string;
}

export const useAhLancamento = (pessoaId?: string) => {
  const [isLoading, setIsLoading] = useState(false);

  const registrarLancamentoAH = async (dados: ProdutividadeAH) => {
    try {
      setIsLoading(true);

      // Garantir que aluno_id existe se foi passado na inicialização do hook
      const dadosCompletos = {
        ...dados,
        aluno_id: pessoaId || dados.aluno_id
      };
      
      console.log('Enviando dados para edge function:', dadosCompletos);
      
      // Chamar a edge function para registrar os dados
      const { data, error } = await supabase.functions.invoke('register-ah', {
        body: { data: dadosCompletos }
      });
      
      if (error) {
        console.error('Erro na resposta da edge function:', error);
        throw new Error(error.message);
      }
      
      console.log('Resposta da edge function:', data);
      
      if (data && data.success) {
        return true;
      } else if (data && data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Resposta inválida da edge function');
      }
      
    } catch (error) {
      console.error('Erro ao registrar lançamento AH:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível registrar o lançamento de Abrindo Horizontes",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getUltimosLancamentosAH = async (pessoaId: string, limit = 5) => {
    try {
      setIsLoading(true);
      
      // Buscar lançamentos na tabela produtividade_ah usando a nova estrutura
      const { data: lancamentos, error } = await supabase
        .from('produtividade_ah')
        .select('*')
        .eq('pessoa_id', pessoaId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Erro ao buscar lançamentos AH:', error);
        return [];
      }
      
      return lancamentos || [];
    } catch (error) {
      console.error('Erro ao buscar lançamentos AH:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    registrarLancamentoAH,
    getUltimosLancamentosAH
  };
};

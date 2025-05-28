
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
      
      if (data && data.webhookError) {
        toast({
          title: "Parcialmente concluído",
          description: data.message || "Dados salvos, mas não sincronizados com webhook externo.",
          variant: "default"
        });
      } else {
        const tipoPessoa = data?.tipo_pessoa === 'funcionario' ? 'funcionário' : 'aluno';
        toast({
          title: "Sucesso",
          description: `Lançamento de Abrindo Horizontes registrado com sucesso para ${tipoPessoa}!`,
        });
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao registrar lançamento AH:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar o lançamento de Abrindo Horizontes",
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
      
      // Primeiro tentar buscar como aluno
      const { data: lancamentosAluno, error: errorAluno } = await supabase
        .from('produtividade_ah')
        .select('*')
        .eq('aluno_id', pessoaId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (!errorAluno && lancamentosAluno && lancamentosAluno.length > 0) {
        return lancamentosAluno;
      }
      
      // Se não encontrou como aluno, tentar como funcionário
      const { data: lancamentosFuncionario, error: errorFuncionario } = await supabase
        .from('produtividade_ah_funcionarios')
        .select('*')
        .eq('funcionario_id', pessoaId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (errorFuncionario) {
        console.error('Erro ao buscar lançamentos AH:', errorFuncionario);
        return [];
      }
      
      return lancamentosFuncionario || [];
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

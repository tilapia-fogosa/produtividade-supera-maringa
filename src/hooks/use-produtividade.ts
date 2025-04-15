
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ProdutividadeAbaco, FaltaAluno } from '@/types/produtividade';

export const useProdutividade = (alunoId: string) => {
  const [isLoading, setIsLoading] = useState(false);

  const registrarPresenca = async (
    presente: boolean,
    data: string,
    motivoFalta?: string
  ) => {
    try {
      setIsLoading(true);
      
      if (!presente) {
        const { error } = await supabase
          .from('faltas_alunos')
          .insert({
            aluno_id: alunoId,
            data_falta: data,
            motivo: motivoFalta
          });

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro ao registrar presença:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar a presença",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const registrarProdutividade = async (dados: Omit<ProdutividadeAbaco, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('produtividade_abaco')
        .insert(dados);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Produtividade registrada com sucesso",
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao registrar produtividade:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar a produtividade",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const buscarFaltasDoDia = async (data: string) => {
    try {
      const { data: faltas, error } = await supabase
        .from('faltas_alunos')
        .select('*')
        .eq('aluno_id', alunoId)
        .eq('data_falta', data)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return faltas;
    } catch (error) {
      console.error('Erro ao buscar faltas:', error);
      return null;
    }
  };

  return {
    isLoading,
    registrarPresenca,
    registrarProdutividade,
    buscarFaltasDoDia
  };
};

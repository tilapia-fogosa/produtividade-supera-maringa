
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ProdutividadeAbaco {
  aluno_id?: string;
  presente: boolean;
  apostila?: string;
  pagina?: number; // Alterado de string para number
  exercicios?: number;
  erros?: number;
  fez_desafio?: boolean;
  comentario?: string;
  data_aula: string;
  is_reposicao?: boolean;
}

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

      // Registrar na tabela presencas
      const { error: presencaError } = await supabase
        .from('presencas')
        .insert({
          aluno_id: alunoId,
          data_aula: data,
          presente: presente,
          observacao: motivoFalta,
          is_reposicao: false
        });

      if (presencaError) throw presencaError;

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

  const registrarProdutividade = async (dados: ProdutividadeAbaco) => {
    try {
      setIsLoading(true);

      // Garantir que aluno_id existe
      const dadosCompletos = {
        ...dados,
        aluno_id: alunoId
      };

      // Converter exercicios e erros para número se forem string
      if (typeof dadosCompletos.exercicios === 'string' && dadosCompletos.exercicios) {
        dadosCompletos.exercicios = Number(dadosCompletos.exercicios);
      }

      if (typeof dadosCompletos.erros === 'string' && dadosCompletos.erros) {
        dadosCompletos.erros = Number(dadosCompletos.erros);
      }
      
      // Converter página para número se for string
      if (typeof dadosCompletos.pagina === 'string' && dadosCompletos.pagina) {
        dadosCompletos.pagina = Number(dadosCompletos.pagina);
      }

      // Registrar produtividade do ábaco
      const { error: produtividadeError } = await supabase
        .from('produtividade_abaco')
        .insert(dadosCompletos);

      if (produtividadeError) throw produtividadeError;

      // Se tiver apostila e página, atualizar o aluno
      if (dados.apostila && dados.pagina !== undefined) {
        const { error: alunoError } = await supabase
          .from('alunos')
          .update({
            apostila_atual: dados.apostila,
            ultima_pagina: dados.pagina, // Agora é um número
            ultima_correcao_ah: new Date().toISOString()
          })
          .eq('id', alunoId);

        if (alunoError) throw alunoError;
      }

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

  return {
    isLoading,
    registrarPresenca,
    registrarProdutividade
  };
};


import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ProdutividadeAbaco } from '@/types/produtividade';

interface ProdutividadeInput {
  aluno_id?: string;
  presente: boolean;
  apostila?: string;
  pagina?: number | string;
  exercicios?: number | string;
  erros?: number | string;
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
      
      // Preparar dados para a edge function
      const produtividadeData = {
        aluno_id: alunoId,
        presente: presente,
        motivo_falta: motivoFalta,
        data_registro: data
      };
      
      // Chamar a edge function
      const { data: responseData, error } = await supabase.functions.invoke('register-productivity', {
        body: { data: produtividadeData }
      });
      
      if (error) throw error;
      
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

  const registrarProdutividade = async (dados: ProdutividadeInput) => {
    try {
      setIsLoading(true);

      // Garantir que aluno_id existe
      const dadosCompletos = {
        ...dados,
        aluno_id: alunoId
      };

      // Converter exercicios e erros para número se forem string
      const exercicios = typeof dadosCompletos.exercicios === 'string' && dadosCompletos.exercicios 
        ? Number(dadosCompletos.exercicios) 
        : dadosCompletos.exercicios;
        
      const erros = typeof dadosCompletos.erros === 'string' && dadosCompletos.erros 
        ? Number(dadosCompletos.erros) 
        : dadosCompletos.erros;
      
      // Converter página para número se for string
      const pagina = typeof dadosCompletos.pagina === 'string' && dadosCompletos.pagina 
        ? Number(dadosCompletos.pagina) 
        : dadosCompletos.pagina;

      // Preparar dados para a edge function
      const produtividadeData = {
        aluno_id: alunoId,
        presente: dadosCompletos.presente,
        apostila_abaco: dadosCompletos.apostila,
        pagina_abaco: pagina ? String(pagina) : undefined,
        exercicios_abaco: exercicios ? String(exercicios) : undefined,
        erros_abaco: erros ? String(erros) : undefined,
        fez_desafio: dadosCompletos.fez_desafio,
        comentario: dadosCompletos.comentario,
        data_registro: dadosCompletos.data_aula,
        data_ultima_correcao_ah: new Date().toISOString(),
        apostila_atual: dadosCompletos.apostila,
        ultima_pagina: pagina ? String(pagina) : undefined,
        is_reposicao: dadosCompletos.is_reposicao || false
      };
      
      // Chamar a edge function
      const { data, error } = await supabase.functions.invoke('register-productivity', {
        body: { data: produtividadeData }
      });
      
      if (error) throw error;
      
      if (data && data.webhookError) {
        toast({
          title: "Parcialmente concluído",
          description: data.message || "Dados salvos no banco, mas não sincronizados com webhook externo.",
          variant: "default"
        });
      }

      return true;
    } catch (error) {
      console.error('Erro ao registrar produtividade:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar a produtividade",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Nova função para excluir registro de produtividade
  const excluirProdutividade = async (registroId: string) => {
    try {
      setIsLoading(true);
      
      // Chamar a edge function para excluir
      const { data, error } = await supabase.functions.invoke('register-productivity', {
        body: { 
          action: 'delete',
          id: registroId
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Registro removido com sucesso",
        variant: "default"
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao excluir produtividade:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o registro",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Nova função para atualizar registro de produtividade
  const atualizarProdutividade = async (registroId: string, dados: ProdutividadeInput) => {
    try {
      setIsLoading(true);
      
      // Garantir que aluno_id existe
      const dadosCompletos = {
        ...dados,
        aluno_id: alunoId
      };

      // Converter exercicios e erros para número se forem string
      const exercicios = typeof dadosCompletos.exercicios === 'string' && dadosCompletos.exercicios 
        ? Number(dadosCompletos.exercicios) 
        : dadosCompletos.exercicios;
        
      const erros = typeof dadosCompletos.erros === 'string' && dadosCompletos.erros 
        ? Number(dadosCompletos.erros) 
        : dadosCompletos.erros;
      
      // Converter página para número se for string
      const pagina = typeof dadosCompletos.pagina === 'string' && dadosCompletos.pagina 
        ? Number(dadosCompletos.pagina) 
        : dadosCompletos.pagina;

      // Preparar dados para a edge function
      const produtividadeData = {
        id: registroId,
        aluno_id: alunoId,
        presente: dadosCompletos.presente,
        apostila: dadosCompletos.apostila,
        pagina: pagina ? String(pagina) : undefined,
        exercicios: exercicios ? String(exercicios) : undefined,
        erros: erros ? String(erros) : undefined,
        fez_desafio: dadosCompletos.fez_desafio,
        comentario: dadosCompletos.comentario,
        data_aula: dadosCompletos.data_aula
      };
      
      // Chamar a edge function
      const { data, error } = await supabase.functions.invoke('register-productivity', {
        body: { 
          action: 'update',
          data: produtividadeData
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Registro atualizado com sucesso",
        variant: "default"
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar produtividade:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o registro",
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
    registrarProdutividade,
    excluirProdutividade,
    atualizarProdutividade
  };
};

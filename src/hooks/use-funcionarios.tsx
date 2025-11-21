
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Funcionario {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  cargo: string | null;
  turma_id: string | null;
  active: boolean;
  created_at: string;
  turma?: {
    id: string;
    nome: string;
  } | null;
  unit_id: string;
  foto_devolutiva_url: string | null;
  pdf_devolutiva_url: string | null;
  // Campos adicionados após migração
  codigo?: string;
  ultimo_nivel?: string;
  ultima_pagina?: number;
  niveldesafio?: string; // Alterado para string
  ultima_correcao_ah?: string;
  data_onboarding?: string | null;
}

export function useFuncionarios() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFuncionarios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('funcionarios')
        .select('*, turma:turmas(id, nome)')
        .eq('active', true)
        .order('nome');

      if (error) throw error;
      setFuncionarios(data || []);
    } catch (error) {
      console.error('Erro ao buscar funcionários:', error);
      setError(error.message);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de funcionários",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const adicionarFuncionario = async (funcionario: Omit<Funcionario, 'id' | 'created_at' | 'active'>) => {
    try {
      // ID exato da unidade de Maringá
      const MARINGA_UNIT_ID = '0df79a04-444e-46ee-b218-59e4b1835f4a';
      
      // Criar uma cópia dos dados para não modificar o objeto original
      const dadosParaEnviar = {
        ...funcionario,
        active: true,
        unit_id: MARINGA_UNIT_ID
      };
      
      // Garantir que turma_id seja null quando não selecionado (não string vazia)
      // Isso é crucial para evitar o erro "invalid syntax for type uuid"
      if (dadosParaEnviar.turma_id === '' || dadosParaEnviar.turma_id === undefined) {
        dadosParaEnviar.turma_id = null;
      }
      
      // Debug detalhado para verificar o formato exato dos dados
      console.log('Tipo de turma_id:', typeof dadosParaEnviar.turma_id);
      console.log('Valor de turma_id:', dadosParaEnviar.turma_id);
      console.log('Adicionando funcionário (dados completos):', dadosParaEnviar);
      
      const { data, error } = await supabase
        .from('funcionarios')
        .insert([dadosParaEnviar])
        .select()
        .single();

      if (error) {
        console.error('Erro detalhado:', error);
        toast({
          title: "Erro",
          description: `Não foi possível adicionar o funcionário: ${error.message}`,
          variant: "destructive"
        });
        return null;
      }
      
      toast({
        title: "Sucesso",
        description: "Funcionário adicionado com sucesso!",
        variant: "default"
      });
      
      // Atualiza a lista de funcionários
      await fetchFuncionarios();
      
      return data;
    } catch (error) {
      console.error('Erro ao adicionar funcionário:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao adicionar o funcionário",
        variant: "destructive"
      });
      return null;
    }
  };

  const atualizarFuncionario = async (id: string, dados: Partial<Funcionario>) => {
    try {
      // Garantir que turma_id seja null quando não selecionado (não string vazia)
      if (dados.turma_id === '') {
        dados.turma_id = null;
      }
      
      const { error } = await supabase
        .from('funcionarios')
        .update(dados)
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Funcionário atualizado com sucesso!",
      });
      
      await fetchFuncionarios();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o funcionário",
        variant: "destructive"
      });
      return false;
    }
  };

  const removerFuncionario = async (id: string) => {
    try {
      const { error } = await supabase
        .from('funcionarios')
        .update({ active: false })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Funcionário removido com sucesso!",
      });
      
      await fetchFuncionarios();
      return true;
    } catch (error) {
      console.error('Erro ao remover funcionário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o funcionário",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchFuncionarios();
  }, []);

  return {
    funcionarios,
    loading,
    error,
    adicionarFuncionario,
    atualizarFuncionario,
    removerFuncionario,
    recarregarFuncionarios: fetchFuncionarios
  };
}

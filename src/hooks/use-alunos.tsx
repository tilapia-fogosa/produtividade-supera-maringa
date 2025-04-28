
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Aluno {
  id: string;
  nome: string;
  data_onboarding: string | null;
  coordenador_responsavel: string | null;
  motivo_procura: string | null;
  percepcao_coordenador: string | null;
  avaliacao_abaco: string | null;
  avaliacao_ah: string | null;
  pontos_atencao: string | null;
  active: boolean;
  turma_id: string; // Alterado de opcional para obrigatório para manter compatibilidade com use-professor-turmas.tsx
  codigo?: string;
  email?: string;
  telefone?: string;
  ultimo_nivel?: string;
  ultima_pagina?: number;
  niveldesafio?: number;
  ultima_correcao_ah?: string;
}

export function useAlunos() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [todosAlunos, setTodosAlunos] = useState<Aluno[]>([]);
  const [alunoDetalhes, setAlunoDetalhes] = useState<Aluno | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [turmaSelecionada, setTurmaSelecionada] = useState<string | null>(null);
  const [carregandoAlunos, setCarregandoAlunos] = useState(false);
  const [produtividadeRegistrada, setProdutividadeRegistrada] = useState<Record<string, boolean>>({});

  useEffect(() => {
    buscarAlunos();
    buscarTodosAlunos();
  }, []);

  const buscarAlunos = async () => {
    try {
      setCarregando(true);
      const { data: alunosData, error } = await supabase
        .from('alunos')
        .select('*')
        .eq('active', true)
        .order('nome');

      if (error) throw error;
      setAlunos(alunosData);
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de alunos.",
        variant: "destructive"
      });
    } finally {
      setCarregando(false);
    }
  };

  const buscarTodosAlunos = async () => {
    try {
      const { data: alunosData, error } = await supabase
        .from('alunos')
        .select('*')
        .order('nome');

      if (error) throw error;
      setTodosAlunos(alunosData);
    } catch (error) {
      console.error('Erro ao buscar todos os alunos:', error);
    }
  };

  const mostrarDetalhesAluno = (aluno: Aluno) => {
    setAlunoDetalhes(aluno);
  };

  const fecharDetalhesAluno = () => {
    setAlunoDetalhes(null);
  };

  const handleTurmaSelecionada = (turmaId: string) => {
    setTurmaSelecionada(turmaId);
    setCarregandoAlunos(true);
    // Lógica adicional conforme necessário
    setCarregandoAlunos(false);
  };

  const handleRegistrarPresenca = (alunoId: string) => {
    // Implemente a lógica conforme necessário
    console.log('Registrando presença para:', alunoId);
  };

  const voltarParaTurmas = () => {
    setTurmaSelecionada(null);
  };

  const atualizarProdutividadeRegistrada = (alunoId: string, registrado: boolean) => {
    setProdutividadeRegistrada(prev => ({
      ...prev,
      [alunoId]: registrado
    }));
  };

  return {
    alunos,
    todosAlunos,
    alunoDetalhes,
    carregando,
    turmaSelecionada,
    carregandoAlunos,
    produtividadeRegistrada,
    mostrarDetalhesAluno,
    fecharDetalhesAluno,
    handleTurmaSelecionada,
    handleRegistrarPresenca,
    voltarParaTurmas,
    atualizarProdutividadeRegistrada
  };
}

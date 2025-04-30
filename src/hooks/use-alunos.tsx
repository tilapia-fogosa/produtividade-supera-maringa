import { useState, useEffect, useCallback, useRef } from 'react';
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
  turma_id: string; 
  codigo?: string;
  email?: string;
  telefone?: string;
  ultimo_nivel?: string;
  ultima_pagina?: number;
  niveldesafio?: string;
  ultima_correcao_ah?: string;
  unit_id: string;
}

export function useAlunos() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [todosAlunos, setTodosAlunos] = useState<Aluno[]>([]);
  const [alunoDetalhes, setAlunoDetalhes] = useState<Aluno | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [turmaSelecionada, setTurmaSelecionada] = useState<string | null>(null);
  const [carregandoAlunos, setCarregandoAlunos] = useState(false);
  const [produtividadeRegistrada, setProdutividadeRegistrada] = useState<Record<string, boolean>>({});
  const [dataRegistroProdutividade, setDataRegistroProdutividade] = useState<string>('');
  
  // Ref para armazenar a última data verificada e evitar consultas repetidas
  const ultimaDataVerificadaRef = useRef<string>('');

  useEffect(() => {
    buscarAlunos();
    buscarTodosAlunos();
    
    // Definir a data atual como data de registro
    const hoje = new Date().toISOString().split('T')[0];
    setDataRegistroProdutividade(hoje);
    ultimaDataVerificadaRef.current = hoje;
  }, []);

  // Removemos o useEffect que monitora turmaSelecionada para evitar cargas duplicadas

  const buscarAlunos = async () => {
    try {
      setCarregando(true);
      const { data: alunosData, error } = await supabase
        .from('alunos')
        .select('*')
        .eq('active', true)
        .order('nome');

      if (error) throw error;
      setAlunos(alunosData as Aluno[]);
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

  const buscarAlunosPorTurma = useCallback(async (turmaId: string) => {
    try {
      setCarregandoAlunos(true);
      
      // Primeiro, obter o unit_id da turma
      const { data: turmaData, error: turmaError } = await supabase
        .from('turmas')
        .select('unit_id')
        .eq('id', turmaId)
        .single();
      
      if (turmaError) throw turmaError;
      
      // Buscar alunos específicos para esta turma e unidade
      const { data: alunosData, error } = await supabase
        .from('alunos')
        .select('*')
        .eq('turma_id', turmaId)
        .eq('unit_id', turmaData.unit_id)
        .eq('active', true)
        .order('nome');

      if (error) throw error;
      
      console.log(`Encontrados ${alunosData.length} alunos para turma ${turmaId} da unidade ${turmaData.unit_id}`);
      setAlunos(alunosData as Aluno[]);
      
      // Verificar registros de produtividade para o dia atual (usando a tabela correta)
      const hoje = new Date().toISOString().split('T')[0];
      const { data: registrosData, error: registrosError } = await supabase
        .from('produtividade_abaco')
        .select('aluno_id')
        .eq('data_aula', hoje);
        
      if (registrosError) throw registrosError;
      
      // Resetar o estado da produtividade registrada
      const novoEstado: Record<string, boolean> = {};
      if (registrosData && registrosData.length > 0) {
        registrosData.forEach(registro => {
          novoEstado[registro.aluno_id] = true;
        });
      }
      
      setProdutividadeRegistrada(novoEstado);
      setDataRegistroProdutividade(hoje);
      ultimaDataVerificadaRef.current = hoje;
      
    } catch (error) {
      console.error('Erro ao buscar alunos por turma:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de alunos desta turma.",
        variant: "destructive"
      });
    } finally {
      setCarregandoAlunos(false);
    }
  }, []);

  const buscarTodosAlunos = async () => {
    try {
      const { data: alunosData, error } = await supabase
        .from('alunos')
        .select('*')
        .eq('active', true) // Garantir que apenas alunos ativos sejam incluídos
        .order('nome');

      if (error) throw error;
      
      // Filtrando alunos duplicados (mesmo ID)
      const alunosMap = new Map<string, Aluno>();
      
      // Para cada aluno, armazenamos apenas a última ocorrência no Map,
      // garantindo que cada ID seja único
      alunosData.forEach(aluno => {
        alunosMap.set(aluno.id, aluno);
      });
      
      // Convertemos o Map de volta para array
      const alunosUnicos = Array.from(alunosMap.values());
      
      console.log(`Encontrados ${alunosData.length} alunos totais, filtrados para ${alunosUnicos.length} únicos`);
      setTodosAlunos(alunosUnicos as Aluno[]);
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

  // Modificamos handleTurmaSelecionada para chamar buscarAlunosPorTurma diretamente
  const handleTurmaSelecionada = useCallback((turmaId: string) => {
    setTurmaSelecionada(turmaId);
    buscarAlunosPorTurma(turmaId);
  }, [buscarAlunosPorTurma]);

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
    
    // Verificar se a data atual é diferente da data armazenada
    const hoje = new Date().toISOString().split('T')[0];
    if (hoje !== dataRegistroProdutividade) {
      // Se for um novo dia, atualizamos a data de registro
      setDataRegistroProdutividade(hoje);
      // Não resetamos o estado completo aqui, pois isso será feito no componente
    }
  };

  return {
    alunos,
    todosAlunos,
    alunoDetalhes,
    carregando,
    turmaSelecionada,
    carregandoAlunos,
    produtividadeRegistrada,
    dataRegistroProdutividade,
    mostrarDetalhesAluno,
    fecharDetalhesAluno,
    handleTurmaSelecionada,
    handleRegistrarPresenca,
    voltarParaTurmas,
    atualizarProdutividadeRegistrada,
    buscarAlunosPorTurma
  };
}

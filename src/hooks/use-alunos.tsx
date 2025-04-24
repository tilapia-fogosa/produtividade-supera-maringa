
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Aluno } from './use-professor-turmas';

export function useAlunos() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [todosAlunos, setTodosAlunos] = useState<Aluno[]>([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState<string | null>(null);
  const [alunoDetalhes, setAlunoDetalhes] = useState<Aluno | null>(null);
  const [carregandoAlunos, setCarregandoAlunos] = useState(false);
  const [produtividadeRegistrada, setProdutividadeRegistrada] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Carregar todos os alunos para uso na reposição de aula
    const fetchTodosAlunos = async () => {
      try {
        const { data, error } = await supabase
          .from('alunos')
          .select('*')
          .order('nome');
          
        if (error) {
          throw error;
        }
        
        // Converter para o tipo Aluno
        const alunosTyped: Aluno[] = data || [];
        setTodosAlunos(alunosTyped);
      } catch (error) {
        console.error('Erro ao buscar todos os alunos:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar a lista completa de alunos.",
          variant: "destructive"
        });
      }
    };

    fetchTodosAlunos();
  }, []);

  const verificarProdutividadeHoje = async (alunosLista: Aluno[]) => {
    try {
      // Obter a data de hoje no formato YYYY-MM-DD
      const dataHoje = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('produtividade_abaco')
        .select('aluno_id')
        .eq('data_aula', dataHoje);
        
      if (error) {
        throw error;
      }
      
      // Criar um mapa para fácil verificação
      const alunosComPresenca: Record<string, boolean> = {};
      data?.forEach(registro => {
        alunosComPresenca[registro.aluno_id] = true;
      });
      
      setProdutividadeRegistrada(alunosComPresenca);
    } catch (error) {
      console.error('Erro ao verificar produtividade:', error);
    }
  };

  const handleTurmaSelecionada = async (turmaId: string) => {
    setTurmaSelecionada(turmaId);
    setAlunoDetalhes(null);
    setCarregandoAlunos(true);
    
    try {
      const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .eq('turma_id', turmaId)
        .order('nome');
        
      if (error) {
        throw error;
      }
      
      // Converter para o tipo Aluno
      const alunosTyped: Aluno[] = data || [];
      setAlunos(alunosTyped);
      
      // Verificar quais alunos já tiveram produtividade registrada hoje
      await verificarProdutividadeHoje(alunosTyped);
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de alunos.",
        variant: "destructive"
      });
    } finally {
      setCarregandoAlunos(false);
    }
  };

  const handleRegistrarPresenca = async (alunoId: string) => {
    // Implementação futura
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "O registro de presença será implementado em breve.",
    });
  };

  const atualizarProdutividadeRegistrada = async (alunoId: string) => {
    // Atualizar o estado local após registrar a presença
    setProdutividadeRegistrada(prev => ({
      ...prev,
      [alunoId]: true
    }));
  };

  const mostrarDetalhesAluno = (aluno: Aluno) => {
    setAlunoDetalhes(aluno);
  };

  const fecharDetalhesAluno = () => {
    setAlunoDetalhes(null);
  };

  const voltarParaTurmas = () => {
    setTurmaSelecionada(null);
    setAlunoDetalhes(null);
  };

  return {
    alunos,
    todosAlunos,
    turmaSelecionada,
    alunoDetalhes,
    carregandoAlunos,
    produtividadeRegistrada,
    handleTurmaSelecionada,
    handleRegistrarPresenca,
    mostrarDetalhesAluno,
    fecharDetalhesAluno,
    voltarParaTurmas,
    atualizarProdutividadeRegistrada
  };
}

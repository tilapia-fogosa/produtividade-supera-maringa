
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
        
        setTodosAlunos(data || []);
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
      
      setAlunos(data || []);
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

  const handleRegistrarPresenca = (alunoId: string) => {
    // Implementação futura
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "O registro de presença será implementado em breve.",
    });
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
    handleTurmaSelecionada,
    handleRegistrarPresenca,
    mostrarDetalhesAluno,
    fecharDetalhesAluno,
    voltarParaTurmas
  };
}

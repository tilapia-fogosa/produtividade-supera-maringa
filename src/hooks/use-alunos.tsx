
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
}

export function useAlunos() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [alunoDetalhes, setAlunoDetalhes] = useState<Aluno | null>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    buscarAlunos();
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

  const mostrarDetalhesAluno = (aluno: Aluno) => {
    setAlunoDetalhes(aluno);
  };

  const fecharDetalhesAluno = () => {
    setAlunoDetalhes(null);
  };

  return {
    alunos,
    alunoDetalhes,
    carregando,
    mostrarDetalhesAluno,
    fecharDetalhesAluno
  };
}

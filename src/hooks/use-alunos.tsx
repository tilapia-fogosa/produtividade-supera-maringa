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
    const fetchTodosAlunos = async () => {
      try {
        const { data: alunosData, error: alunosError } = await supabase
          .from('alunos')
          .select('*')
          .eq('active', true)
          .order('nome');
          
        if (alunosError) {
          throw alunosError;
        }

        const { data: funcionariosData, error: funcionariosError } = await supabase
          .from('funcionarios')
          .select('*')
          .eq('active', true)
          .order('nome');

        if (funcionariosError) {
          throw funcionariosError;
        }
        
        const funcionariosComoAlunos = funcionariosData?.map(func => ({
          ...func,
          id: func.id,
          nome: func.nome,
          turma_id: func.turma_id,
          is_funcionario: true,
          active: true
        })) || [];

        const todosRegistros = [...(alunosData || []), ...funcionariosComoAlunos];
        
        const registrosUnicos = todosRegistros.reduce((acc: Aluno[], current) => {
          const existe = acc.find(aluno => aluno.id === current.id);
          if (!existe) {
            acc.push(current);
          }
          return acc;
        }, []);
        
        setTodosAlunos(registrosUnicos);
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
      const dataHoje = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('produtividade_abaco')
        .select('aluno_id')
        .eq('data_aula', dataHoje);
        
      if (error) {
        throw error;
      }
      
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
      const { data: alunosRegulares, error: errorRegulares } = await supabase
        .from('alunos')
        .select('*')
        .eq('turma_id', turmaId)
        .eq('active', true)
        .order('nome');
        
      if (errorRegulares) {
        throw errorRegulares;
      }
      
      const { data: funcionarios, error: errorFuncionarios } = await supabase
        .from('funcionarios')
        .select('*')
        .eq('active', true)
        .eq('turma_id', turmaId)
        .order('nome');
        
      if (errorFuncionarios) {
        throw errorFuncionarios;
      }
      
      const funcionariosComoAlunos = funcionarios?.map(func => ({
        ...func,
        id: func.id,
        nome: func.nome,
        turma_id: func.turma_id,
        is_funcionario: true,
        active: true
      })) || [];
      
      const todosAlunosDaTurma = [
        ...(alunosRegulares || []),
        ...funcionariosComoAlunos
      ];
      
      console.log('Total de registros na turma:', todosAlunosDaTurma.length);
      
      setAlunos(todosAlunosDaTurma);
      
      await verificarProdutividadeHoje(todosAlunosDaTurma);
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
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "O registro de presença será implementado em breve.",
    });
  };

  const atualizarProdutividadeRegistrada = async (alunoId: string) => {
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

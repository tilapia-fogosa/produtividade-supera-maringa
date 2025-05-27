
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Turma } from './use-professor-turmas';

export interface PessoaTurmaDetalhes {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  turma_id: string;
  active: boolean;
  origem: 'aluno' | 'funcionario';
  unit_id?: string;
  codigo?: string;
  ultimo_nivel?: string;
  ultima_pagina?: number;
  niveldesafio?: string;
  ultima_correcao_ah?: string;
  data_onboarding?: string | null;
  cargo?: string | null;
  // Campos específicos de alunos
  matricula?: string;
  curso?: string;
  // Campos específicos de funcionários
  is_funcionario?: boolean;
}

export function useTurmaDetalhes(turmaId?: string | null) {
  const [turma, setTurma] = useState<Turma | null>(null);
  const [pessoas, setPessoas] = useState<PessoaTurmaDetalhes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!turmaId) {
      setLoading(false);
      setTurma(null);
      setPessoas([]);
      setError(null);
      return;
    }

    const fetchTurmaEPessoas = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Carregando detalhes da turma:', turmaId);
        
        // Buscar turma e professor
        const { data: turmaData, error: turmaError } = await supabase
          .from('turmas')
          .select('*, professor:professores(id, nome)')
          .eq('id', turmaId)
          .single();

        if (turmaError) throw turmaError;
        
        // Definindo a sala como string vazia se não existir no banco de dados
        const turmaCompleta: Turma = {
          ...turmaData,
          sala: turmaData.sala || '',
          // Garantimos que o professor_id contenha o nome para exibição
          professor_id: turmaData.professor?.nome || turmaData.professor_id
        };
        
        // Buscar alunos da turma
        const { data: alunosData, error: alunosError } = await supabase
          .from('alunos')
          .select('*')
          .eq('turma_id', turmaId)
          .eq('active', true)
          .eq('unit_id', turmaData.unit_id)
          .order('nome');

        if (alunosError) throw alunosError;

        // Buscar funcionários da turma
        const { data: funcionariosData, error: funcionariosError } = await supabase
          .from('funcionarios')
          .select('*')
          .eq('turma_id', turmaId)
          .eq('active', true)
          .eq('unit_id', turmaData.unit_id)
          .order('nome');

        if (funcionariosError) throw funcionariosError;

        // Converter alunos para o formato comum
        const alunosConvertidos: PessoaTurmaDetalhes[] = alunosData.map(aluno => ({
          ...aluno,
          origem: 'aluno' as const
        }));

        // Converter funcionários para o formato comum
        const funcionariosConvertidos: PessoaTurmaDetalhes[] = funcionariosData.map(funcionario => ({
          ...funcionario,
          origem: 'funcionario' as const
        }));

        // Combinar e ordenar por nome
        const todasPessoas = [...alunosConvertidos, ...funcionariosConvertidos]
          .sort((a, b) => a.nome.localeCompare(b.nome));

        console.log(`Encontrados ${alunosData?.length || 0} alunos e ${funcionariosData?.length || 0} funcionários para a turma ${turmaData.nome}`);
        
        setTurma(turmaCompleta);
        setPessoas(todasPessoas);
      } catch (err) {
        console.error('Erro ao carregar turma:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados da turma');
      } finally {
        setLoading(false);
      }
    };

    fetchTurmaEPessoas();
  }, [turmaId]);

  // Manter compatibilidade com código existente que espera 'alunos'
  const alunos = pessoas;

  return {
    turma,
    alunos,
    pessoas,
    loading,
    error
  };
}

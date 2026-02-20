
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
  ultima_pagina?: number | null; // Padronizado como number | null
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

        if (turmaError) {
          console.error('Erro ao buscar turma:', turmaError);
          throw turmaError;
        }
        
        console.log('Dados da turma:', turmaData);
        
        // Definindo a sala como string vazia se não existir no banco de dados
        const turmaCompleta: Turma = {
          ...turmaData,
          sala: turmaData.sala || '',
          // Garantimos que o professor_id contenha o nome para exibição
          professor_id: turmaData.professor?.nome || turmaData.professor_id
        };
        
        // Buscar alunos da turma
        console.log('Buscando alunos para turma_id:', turmaId, 'unit_id:', turmaData.unit_id);
        const { data: alunosData, error: alunosError } = await supabase
          .from('alunos')
          .select('*')
          .eq('turma_id', turmaId)
          .eq('active', true);

        if (alunosError) {
          console.error('Erro ao buscar alunos:', alunosError);
          throw alunosError;
        }

        console.log('Alunos encontrados:', alunosData?.length || 0, alunosData);

        // Buscar funcionários da turma
        console.log('Buscando funcionários para turma_id:', turmaId, 'unit_id:', turmaData.unit_id);
        const { data: funcionariosData, error: funcionariosError } = await supabase
          .from('funcionarios')
          .select('*')
          .eq('turma_id', turmaId)
          .eq('active', true);

        if (funcionariosError) {
          console.error('Erro ao buscar funcionários:', funcionariosError);
          throw funcionariosError;
        }

        console.log('Funcionários encontrados:', funcionariosData?.length || 0, funcionariosData);

        // Converter alunos para o formato comum
        const alunosConvertidos: PessoaTurmaDetalhes[] = (alunosData || []).map(aluno => ({
          ...aluno,
          origem: 'aluno' as const,
          turma_id: aluno.turma_id || turmaId,
          ultima_pagina: aluno.ultima_pagina // Já é number | null
        }));

        // Converter funcionários para o formato comum
        const funcionariosConvertidos: PessoaTurmaDetalhes[] = (funcionariosData || []).map(funcionario => ({
          ...funcionario,
          origem: 'funcionario' as const,
          turma_id: funcionario.turma_id || turmaId,
          ultima_pagina: funcionario.ultima_pagina // Já é number | null
        }));

        // Combinar e ordenar por nome
        const todasPessoas = [...alunosConvertidos, ...funcionariosConvertidos]
          .sort((a, b) => a.nome.localeCompare(b.nome));

        console.log(`Total de pessoas encontradas: ${todasPessoas.length} (${alunosData?.length || 0} alunos + ${funcionariosData?.length || 0} funcionários)`);
        console.log('Pessoas combinadas:', todasPessoas);
        
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

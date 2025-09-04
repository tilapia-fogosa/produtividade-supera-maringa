import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TodosAlunosItem {
  id: string;
  nome: string;
  turma_nome: string | null;
  unit_id: string;
  ultima_correcao_ah: string | null;
  origem: 'aluno' | 'funcionario';
  turma_id: string | null;
  active: boolean;
  codigo?: string;
  email?: string;
  telefone?: string;
  ultimo_nivel?: string;
  ultima_pagina?: number;
  niveldesafio?: string;
}

export const useTodosAlunos = () => {
  const [alunos, setAlunos] = useState<TodosAlunosItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    const buscarTodosAlunos = async () => {
      try {
        setLoading(true);

        // Buscar alunos ativos
        const { data: alunosData, error: alunosError } = await supabase
          .from('alunos')
          .select(`
            id,
            nome,
            unit_id,
            turma_id,
            active,
            ultima_correcao_ah,
            codigo,
            email,
            telefone,
            ultimo_nivel,
            ultima_pagina,
            niveldesafio,
            turmas!left (
              nome
            )
          `)
          .eq('active', true)
          .order('nome');

        if (alunosError) {
          console.error('Erro ao buscar alunos:', alunosError);
          return;
        }

        // Buscar funcionários ativos
        const { data: funcionariosData, error: funcionariosError } = await supabase
          .from('funcionarios')
          .select(`
            id,
            nome,
            unit_id,
            turma_id,
            active,
            ultima_correcao_ah,
            codigo,
            email,
            telefone,
            ultimo_nivel,
            ultima_pagina,
            niveldesafio,
            turmas!left (
              nome
            )
          `)
          .eq('active', true)
          .order('nome');

        if (funcionariosError) {
          console.error('Erro ao buscar funcionários:', funcionariosError);
          return;
        }

        // Combinar e formatar dados
        const todosAlunos: TodosAlunosItem[] = [
          ...(alunosData || []).map(aluno => ({
            id: aluno.id,
            nome: aluno.nome,
            turma_nome: aluno.turmas?.nome || null,
            turma_id: aluno.turma_id,
            unit_id: aluno.unit_id,
            active: aluno.active,
            ultima_correcao_ah: aluno.ultima_correcao_ah,
            codigo: aluno.codigo,
            email: aluno.email,
            telefone: aluno.telefone,
            ultimo_nivel: aluno.ultimo_nivel,
            ultima_pagina: aluno.ultima_pagina,
            niveldesafio: aluno.niveldesafio,
            origem: 'aluno' as const
          })),
          ...(funcionariosData || []).map(funcionario => ({
            id: funcionario.id,
            nome: funcionario.nome,
            turma_nome: funcionario.turmas?.nome || null,
            turma_id: funcionario.turma_id,
            unit_id: funcionario.unit_id,
            active: funcionario.active,
            ultima_correcao_ah: funcionario.ultima_correcao_ah,
            codigo: funcionario.codigo,
            email: funcionario.email,
            telefone: funcionario.telefone,
            ultimo_nivel: funcionario.ultimo_nivel,
            ultima_pagina: funcionario.ultima_pagina,
            niveldesafio: funcionario.niveldesafio,
            origem: 'funcionario' as const
          }))
        ];

        // Ordenar por nome
        todosAlunos.sort((a, b) => a.nome.localeCompare(b.nome));

        setAlunos(todosAlunos);
      } catch (error) {
        console.error('Erro ao buscar todos os alunos:', error);
      } finally {
        setLoading(false);
      }
    };

    buscarTodosAlunos();
  }, []);

  // Filtrar alunos baseado no texto
  const alunosFiltrados = useMemo(() => {
    if (!filtro.trim()) return alunos;
    
    const filtroLower = filtro.toLowerCase().trim();
    return alunos.filter(aluno => 
      aluno.nome.toLowerCase().includes(filtroLower) ||
      (aluno.turma_nome && aluno.turma_nome.toLowerCase().includes(filtroLower))
    );
  }, [alunos, filtro]);

  return {
    alunos: alunosFiltrados,
    loading,
    filtro,
    setFiltro,
    totalAlunos: alunos.length,
    totalFiltrados: alunosFiltrados.length
  };
};
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useActiveUnit } from '@/contexts/ActiveUnitContext';

export interface TodosAlunosItem {
  id: string;
  nome: string;
  turma_nome: string | null;
  unit_id: string | null;
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
  const { activeUnit } = useActiveUnit();

  useEffect(() => {
    if (!activeUnit?.id) return;

    const buscarTodosAlunos = async () => {
      try {
        setLoading(true);

        const [{ data: alunosData, error: errAlunos }, { data: funcsData, error: errFuncs }] = await Promise.all([
          supabase
            .from('alunos')
            .select('id, nome, email, telefone, turma_id, ultima_correcao_ah, turmas(nome)')
            .eq('active', true)
            .eq('unit_id', activeUnit.id)
            .order('nome'),
          supabase
            .from('funcionarios')
            .select('id, nome, email, telefone, turma_id, ultima_correcao_ah, cargo, turmas(nome)')
            .eq('active', true)
            .eq('unit_id', activeUnit.id)
            .order('nome'),
        ]);

        if (errAlunos) throw errAlunos;
        if (errFuncs) throw errFuncs;

        const todosPessoas: TodosAlunosItem[] = [
          ...(alunosData || []).map((a: any) => ({
            id: a.id,
            nome: a.nome,
            turma_nome: a.turmas?.nome || 'Sem turma',
            turma_id: a.turma_id,
            unit_id: activeUnit.id,
            active: true,
            ultima_correcao_ah: a.ultima_correcao_ah,
            origem: 'aluno' as const,
            email: a.email,
            telefone: a.telefone,
          })),
          ...(funcsData || []).map((f: any) => ({
            id: f.id,
            nome: f.nome,
            turma_nome: f.turmas?.nome || 'Sem turma',
            turma_id: f.turma_id,
            unit_id: activeUnit.id,
            active: true,
            ultima_correcao_ah: f.ultima_correcao_ah,
            origem: 'funcionario' as const,
            email: f.email,
            telefone: f.telefone,
          })),
        ];

        todosPessoas.sort((a, b) => a.nome.localeCompare(b.nome));
        setAlunos(todosPessoas);
      } catch (error) {
        console.error('Erro ao buscar todos os alunos:', error);
      } finally {
        setLoading(false);
      }
    };

    buscarTodosAlunos();
  }, [activeUnit?.id]);

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

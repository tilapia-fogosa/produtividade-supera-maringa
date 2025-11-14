import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

  useEffect(() => {
    const buscarTodosAlunos = async () => {
      try {
        setLoading(true);
        console.log('Buscando todas as pessoas usando função SQL...');

        // Usar a função SQL get_todas_pessoas que já combina alunos e funcionários ativos
        const { data: pessoasData, error } = await supabase
          .rpc('get_todas_pessoas');

        if (error) {
          console.error('Erro ao buscar pessoas:', error);
          throw error;
        }

        // Formatar os dados para o formato esperado
        const todosPessoas = pessoasData?.map(pessoa => ({
          id: pessoa.id,
          nome: pessoa.nome,
          turma_nome: pessoa.turma_nome || 'Sem turma',
          turma_id: pessoa.turma_id,
          unit_id: null, // A função não retorna unit_id atualmente
          active: true, // A view já filtra por active = true
          ultima_correcao_ah: pessoa.ultima_correcao_ah,
          origem: pessoa.origem as 'aluno' | 'funcionario',
          codigo: null, // Não disponível na função atual
          email: pessoa.email,
          telefone: pessoa.telefone,
          ultimo_nivel: null, // Não disponível na função atual
          ultima_pagina: null, // Não disponível na função atual
          niveldesafio: null // Não disponível na função atual
        })) || [];

        console.log('Pessoas carregadas da função SQL:', {
          total: todosPessoas.length,
          porOrigem: todosPessoas.reduce((acc, p) => {
            acc[p.origem] = (acc[p.origem] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        });

        // Ordenar por nome
        todosPessoas.sort((a, b) => a.nome.localeCompare(b.nome));

        setAlunos(todosPessoas);
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
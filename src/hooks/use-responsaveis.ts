
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCorretores } from './use-corretores';
import { useFuncionarios } from './use-funcionarios';

export interface Responsavel {
  id: string;
  nome: string;
  tipo: 'professor' | 'funcionario';
}

export function useResponsaveis() {
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { funcionarios, loading: funcionariosLoading } = useFuncionarios();
  const { corretores, isLoading: corretoresLoading } = useCorretores();

  useEffect(() => {
    const carregarResponsaveis = async () => {
      try {
        setIsLoading(true);
        
        // Aguardar o carregamento de ambas as fontes de dados
        if (funcionariosLoading || corretoresLoading) {
          return;
        }
        
        // Mapear funcionários para o formato de Responsavel
        const responsaveisFuncionarios = funcionarios.map(func => ({
          id: func.id,
          nome: func.nome,
          tipo: 'funcionario' as const
        }));
        
        // Mapear corretores (professores) para o formato de Responsavel
        const responsaveisProfessores = corretores.map(prof => ({
          id: prof.id,
          nome: prof.nome,
          tipo: 'professor' as const
        }));
        
        // Combinar as listas e ordenar por nome
        const todosResponsaveis = [...responsaveisFuncionarios, ...responsaveisProfessores]
          .sort((a, b) => a.nome.localeCompare(b.nome));
          
        setResponsaveis(todosResponsaveis);
      } catch (err) {
        console.error('Erro ao carregar responsáveis:', err);
      } finally {
        setIsLoading(false);
      }
    };

    carregarResponsaveis();
  }, [funcionarios, corretores, funcionariosLoading, corretoresLoading]);

  return {
    responsaveis,
    isLoading
  };
}

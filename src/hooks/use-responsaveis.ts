
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useFuncionarios } from './use-funcionarios';

export interface Responsavel {
  id: string;
  nome: string;
  tipo: 'professor' | 'funcionario';
}

// Lista de cargos que não devem aparecer na lista de responsáveis
const CARGOS_EXCLUIDOS = ['Filha', 'familiar'];

export function useResponsaveis() {
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [professores, setProfessores] = useState<any[]>([]);
  const [loadingProfessores, setLoadingProfessores] = useState(true);
  const { funcionarios, loading: funcionariosLoading } = useFuncionarios();

  // Buscar professores separadamente
  useEffect(() => {
    const buscarProfessores = async () => {
      try {
        const { data: professoresData, error } = await supabase
          .from('professores')
          .select('*');
          
        if (error) throw error;
        
        setProfessores(professoresData || []);
      } catch (error) {
        console.error('Erro ao buscar professores:', error);
        setProfessores([]);
      } finally {
        setLoadingProfessores(false);
      }
    };

    buscarProfessores();
  }, []);

  useEffect(() => {
    const carregarResponsaveis = async () => {
      try {
        setIsLoading(true);
        
        // Aguardar o carregamento de ambas as fontes de dados
        if (funcionariosLoading || loadingProfessores) {
          return;
        }
        
        // Filtrar funcionários que não têm cargos excluídos
        const funcionariosFiltrados = funcionarios.filter(func => 
          !CARGOS_EXCLUIDOS.includes(func.cargo || '')
        );
        
        // Mapear funcionários para o formato de Responsavel
        const responsaveisFuncionarios = funcionariosFiltrados.map(func => ({
          id: func.id,
          nome: func.nome,
          tipo: 'funcionario' as const
        }));
        
        // Mapear professores para o formato de Responsavel
        const responsaveisProfessores = professores.map(prof => ({
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
  }, [funcionarios, professores, funcionariosLoading, loadingProfessores]);

  return {
    responsaveis,
    isLoading
  };
}

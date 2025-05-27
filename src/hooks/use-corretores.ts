
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Corretor } from '@/types/corretores';

export const useCorretores = (unitId?: string) => {
  const [corretores, setCorretores] = useState<Corretor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCorretores = async () => {
      try {
        setIsLoading(true);
        console.log('Buscando corretores...');
        
        // Buscar professores
        const { data: professores, error: profError } = await supabase
          .from('professores')
          .select('*');
          
        if (profError) {
          console.error('Erro ao buscar professores:', profError);
          throw profError;
        }
        
        console.log('Professores encontrados:', professores);
        
        // Buscar estagiários
        const { data: estagiarios, error: estError } = await supabase
          .from('estagiarios')
          .select('*')
          .eq('active', true);
          
        if (estError) {
          console.error('Erro ao buscar estagiários:', estError);
          throw estError;
        }
        
        console.log('Estagiários encontrados:', estagiarios);
        
        // Buscar funcionários com cargo "estagiario"
        const { data: funcionariosEstagiarios, error: funcError } = await supabase
          .from('funcionarios')
          .select('*')
          .eq('active', true)
          .eq('cargo', 'estagiario');
          
        if (funcError) {
          console.error('Erro ao buscar funcionários estagiários:', funcError);
          throw funcError;
        }
        
        console.log('Funcionários estagiários encontrados:', funcionariosEstagiarios);
        
        // Mapear professores para o formato de Corretor
        const professoresFormatados = professores?.map(prof => ({
          id: prof.id,
          nome: prof.nome,
          tipo: 'corretor' as const
        })) || [];
        
        // Mapear estagiários para o formato de Corretor
        const estagiariosFormatados = estagiarios?.map(est => ({
          id: est.id,
          nome: est.nome,
          tipo: 'corretor' as const
        })) || [];
        
        // Mapear funcionários estagiários para o formato de Corretor
        const funcionariosEstagiariosFormatados = funcionariosEstagiarios?.map(func => ({
          id: func.id,
          nome: func.nome,
          tipo: 'corretor' as const
        })) || [];
        
        // Combinar as listas e ordenar por nome
        const todosCorretores = [...professoresFormatados, ...estagiariosFormatados, ...funcionariosEstagiariosFormatados]
          .sort((a, b) => a.nome.localeCompare(b.nome));
          
        console.log('Corretores carregados:', {
          professores: professoresFormatados.length,
          estagiarios: estagiariosFormatados.length,
          funcionariosEstagiarios: funcionariosEstagiariosFormatados.length,
          total: todosCorretores.length,
          listaCompleta: todosCorretores
        });
          
        setCorretores(todosCorretores);
      } catch (err: any) {
        console.error('Erro ao buscar corretores:', err);
        setError(err.message || 'Erro ao carregar corretores');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCorretores();
  }, [unitId]);

  return {
    corretores,
    isLoading,
    error
  };
};

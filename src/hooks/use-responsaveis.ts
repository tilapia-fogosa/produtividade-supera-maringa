import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Responsavel {
  id: string;
  nome: string;
  tipo: 'professor' | 'funcionario';
}

export function useResponsaveis(): { responsaveis: Responsavel[]; isLoading: boolean } {
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResponsaveis = async () => {
      try {
        setIsLoading(true);
        console.log('Buscando responsáveis (professores ativos e estagiários)...');
        
        // Buscar professores com status = true
        const { data: professores, error: errorProfessores } = await supabase
          .from('professores')
          .select('id, nome')
          .eq('status', true);

        if (errorProfessores) {
          console.error('Erro ao buscar professores:', errorProfessores);
          throw errorProfessores;
        }

        // Buscar funcionários com cargo contendo 'estagi' (para pegar estagiario/estagiário) e active = true
        const { data: funcionarios, error: errorFuncionarios } = await supabase
          .from('funcionarios')
          .select('id, nome, cargo')
          .ilike('cargo', '%estagi%')
          .eq('active', true);

        if (errorFuncionarios) {
          console.error('Erro ao buscar funcionários:', errorFuncionarios);
          throw errorFuncionarios;
        }

        console.log('Funcionários encontrados:', funcionarios);

        // Combinar e formatar os dados
        const responsaveisFormatados: Responsavel[] = [
          ...(professores || []).map(prof => ({
            id: prof.id,
            nome: prof.nome,
            tipo: 'professor' as const
          })),
          ...(funcionarios || []).map(func => ({
            id: func.id,
            nome: func.nome,
            tipo: 'funcionario' as const
          }))
        ];

        console.log('Responsáveis carregados:', {
          total: responsaveisFormatados.length,
          professores: professores?.length || 0,
          estagiarios: funcionarios?.length || 0
        });

        // Ordenar por nome
        const responsaveisOrdenados = responsaveisFormatados
          .sort((a, b) => a.nome.localeCompare(b.nome));

        setResponsaveis(responsaveisOrdenados);
      } catch (error) {
        console.error('Erro ao buscar responsáveis:', error);
        setResponsaveis([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResponsaveis();
  }, []);

  return {
    responsaveis,
    isLoading
  };
}
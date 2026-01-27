import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentProfessor } from './use-current-professor';

export interface AulaInaugural {
  id: string;
  titulo: string;
  data: string;
  horario_inicio: string;
  horario_fim: string;
  descricao: string | null;
  cliente_nome?: string;
}

export function useAulasInauguraisProfessor() {
  const { professorId, isProfessor } = useCurrentProfessor();

  const { data, isLoading } = useQuery({
    queryKey: ['aulas-inaugurais-professor', professorId],
    queryFn: async () => {
      if (!professorId) return [];

      // Buscar eventos do tipo aula_zero do professor
      const { data: eventos, error } = await supabase
        .from('eventos_professor')
        .select('id, titulo, data, horario_inicio, horario_fim, descricao')
        .eq('professor_id', professorId)
        .eq('tipo_evento', 'aula_zero')
        .gte('data', new Date().toISOString().split('T')[0]) // A partir de hoje
        .order('data', { ascending: true });

      if (error) throw error;

      return (eventos || []).map(e => ({
        id: e.id,
        titulo: e.titulo || 'Aula Inaugural',
        data: e.data,
        horario_inicio: e.horario_inicio,
        horario_fim: e.horario_fim,
        descricao: e.descricao,
      })) as AulaInaugural[];
    },
    enabled: isProfessor && !!professorId,
  });

  return {
    aulasInaugurais: data || [],
    isLoading,
    isProfessor,
  };
}

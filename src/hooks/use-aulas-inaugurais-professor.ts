import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentProfessor } from './use-current-professor';
import { useUserPermissions } from './useUserPermissions';
import { useActiveUnit } from '@/contexts/ActiveUnitContext';

export interface AulaInaugural {
  id: string;
  titulo: string;
  data: string;
  horario_inicio: string;
  horario_fim: string;
  descricao: string | null;
  cliente_nome?: string;
  professor_nome?: string;
  client_id?: string;
}

export function useAulasInauguraisProfessor() {
  const { professorId, isProfessor } = useCurrentProfessor();
  const { isAdmin, isManagement } = useUserPermissions();
  const { activeUnit } = useActiveUnit();

  const isAdminOrManagement = isAdmin || isManagement;

  const { data, isLoading } = useQuery({
    queryKey: ['aulas-inaugurais-professor', professorId, isAdminOrManagement, activeUnit?.id],
    queryFn: async () => {
      const hojeStr = new Date().toISOString().split('T')[0];

      if (isAdminOrManagement && activeUnit?.id) {
        // Admin: buscar todas as aulas inaugurais da unidade
        // Precisamos fazer join com atividade_pos_venda para pegar o nome do cliente
        const { data: eventos, error } = await supabase
          .from('eventos_professor')
          .select(`
            id, titulo, data, horario_inicio, horario_fim, descricao, client_id,
            professores:professor_id(nome)
          `)
          .eq('tipo_evento', 'aula_zero')
          .gte('data', hojeStr)
          .order('data', { ascending: true });

        if (error) throw error;

        // Buscar nomes dos clientes vinculados
        const clientIds = (eventos || []).map(e => (e as any).client_id).filter(Boolean);
        let clienteNomes: Record<string, string> = {};
        if (clientIds.length > 0) {
          const { data: clientes } = await supabase
            .from('atividade_pos_venda')
            .select('client_id, client_name, full_name')
            .in('client_id', clientIds)
            .eq('unit_id', activeUnit.id);

          if (clientes) {
            clientes.forEach(c => {
              clienteNomes[c.client_id] = c.full_name || c.client_name;
            });
          }
        }

        return (eventos || []).map(e => ({
          id: e.id,
          titulo: e.titulo || 'Aula Inaugural',
          data: e.data,
          horario_inicio: e.horario_inicio,
          horario_fim: e.horario_fim,
          descricao: e.descricao,
          cliente_nome: clienteNomes[(e as any).client_id] || undefined,
          professor_nome: (e as any).professores?.nome || undefined,
          client_id: (e as any).client_id || undefined,
        })) as AulaInaugural[];
      }

      if (isProfessor && professorId) {
        // Professor: buscar apenas seus eventos
        const { data: eventos, error } = await supabase
          .from('eventos_professor')
          .select('id, titulo, data, horario_inicio, horario_fim, descricao, client_id')
          .eq('professor_id', professorId)
          .eq('tipo_evento', 'aula_zero')
          .gte('data', hojeStr)
          .order('data', { ascending: true });

        if (error) throw error;

        // Buscar nomes dos clientes vinculados
        const clientIds = (eventos || []).map(e => (e as any).client_id).filter(Boolean);
        let clienteNomes: Record<string, string> = {};
        if (clientIds.length > 0) {
          const { data: clientes } = await supabase
            .from('atividade_pos_venda')
            .select('client_id, client_name, full_name')
            .in('client_id', clientIds);

          if (clientes) {
            clientes.forEach(c => {
              clienteNomes[c.client_id] = c.full_name || c.client_name;
            });
          }
        }

        return (eventos || []).map(e => ({
          id: e.id,
          titulo: e.titulo || 'Aula Inaugural',
          data: e.data,
          horario_inicio: e.horario_inicio,
          horario_fim: e.horario_fim,
          descricao: e.descricao,
          cliente_nome: clienteNomes[(e as any).client_id] || undefined,
          client_id: (e as any).client_id || undefined,
        })) as AulaInaugural[];
      }

      return [];
    },
    enabled: (isProfessor && !!professorId) || (isAdminOrManagement && !!activeUnit?.id),
  });

  return {
    aulasInaugurais: data || [],
    isLoading,
    isProfessor,
  };
}

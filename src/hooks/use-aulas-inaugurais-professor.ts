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
  atividade_pos_venda_id?: string;
}

async function getCompletedAtividadeIds(atividadeIds: string[]): Promise<Set<string>> {
  const completed = new Set<string>();
  if (atividadeIds.length === 0) return completed;

  const { data: atividades } = await supabase
    .from('atividade_pos_venda')
    .select('id, percepcao_coordenador, motivo_procura, avaliacao_abaco, avaliacao_ah, pontos_atencao')
    .in('id', atividadeIds);

  if (atividades) {
    atividades.forEach(a => {
      if (
        a.percepcao_coordenador && a.percepcao_coordenador.trim() !== '' &&
        a.motivo_procura && a.motivo_procura.trim() !== '' &&
        a.avaliacao_abaco && a.avaliacao_abaco.trim() !== '' &&
        a.avaliacao_ah && a.avaliacao_ah.trim() !== '' &&
        a.pontos_atencao && a.pontos_atencao.trim() !== ''
      ) {
        completed.add(a.id);
      }
    });
  }

  return completed;
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
        const { data: eventos, error } = await supabase
          .from('eventos_professor')
          .select(`
            id, titulo, data, horario_inicio, horario_fim, descricao, client_id, atividade_pos_venda_id,
            professores:professor_id(nome)
          `)
          .eq('tipo_evento', 'aula_zero')
          .gte('data', hojeStr)
          .order('data', { ascending: true });

        if (error) throw error;

        // Buscar nomes dos clientes vinculados
        const atividadeIds = (eventos || []).map(e => (e as any).atividade_pos_venda_id).filter(Boolean);
        let clienteNomes: Record<string, string> = {};
        if (atividadeIds.length > 0) {
          const { data: atividades } = await supabase
            .from('atividade_pos_venda')
            .select('id, client_name, full_name')
            .in('id', atividadeIds)
            .eq('unit_id', activeUnit.id);

          if (atividades) {
            atividades.forEach(a => {
              clienteNomes[a.id] = a.full_name || a.client_name;
            });
          }
        }
        const completedAtividadeIds = await getCompletedAtividadeIds(atividadeIds);

        return (eventos || []).map(e => ({
          id: e.id,
          titulo: e.titulo || 'Aula Inaugural',
          data: e.data,
          horario_inicio: e.horario_inicio,
          horario_fim: e.horario_fim,
          descricao: e.descricao,
          cliente_nome: clienteNomes[(e as any).atividade_pos_venda_id] || undefined,
          professor_nome: (e as any).professores?.nome || undefined,
          client_id: (e as any).client_id || undefined,
          atividade_pos_venda_id: (e as any).atividade_pos_venda_id || undefined,
        })).filter(e => {
          if (!e.atividade_pos_venda_id) return true; // Sem vínculo, manter visível
          if (completedAtividadeIds.has(e.atividade_pos_venda_id)) return false;
          return true;
        }) as AulaInaugural[];
      }

      if (isProfessor && professorId) {
        const { data: eventos, error } = await supabase
          .from('eventos_professor')
          .select('id, titulo, data, horario_inicio, horario_fim, descricao, client_id, atividade_pos_venda_id')
          .eq('professor_id', professorId)
          .eq('tipo_evento', 'aula_zero')
          .gte('data', hojeStr)
          .order('data', { ascending: true });

        if (error) throw error;

        // Buscar nomes dos clientes vinculados
        const atividadeIds = (eventos || []).map(e => (e as any).atividade_pos_venda_id).filter(Boolean);
        let clienteNomes: Record<string, string> = {};
        if (atividadeIds.length > 0) {
          const { data: atividades } = await supabase
            .from('atividade_pos_venda')
            .select('id, client_name, full_name')
            .in('id', atividadeIds);

          if (atividades) {
            atividades.forEach(a => {
              clienteNomes[a.id] = a.full_name || a.client_name;
            });
          }
        }
        const completedAtividadeIds = await getCompletedAtividadeIds(atividadeIds);

        return (eventos || []).map(e => ({
          id: e.id,
          titulo: e.titulo || 'Aula Inaugural',
          data: e.data,
          horario_inicio: e.horario_inicio,
          horario_fim: e.horario_fim,
          descricao: e.descricao,
          cliente_nome: clienteNomes[(e as any).atividade_pos_venda_id] || undefined,
          client_id: (e as any).client_id || undefined,
          atividade_pos_venda_id: (e as any).atividade_pos_venda_id || undefined,
        })).filter(e => {
          if (!e.atividade_pos_venda_id) return true; // Sem vínculo, manter visível
          if (completedAtividadeIds.has(e.atividade_pos_venda_id)) return false;
          return true;
        }) as AulaInaugural[];
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

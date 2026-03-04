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
  status?: string;
}

function isCompleted(row: any): boolean {
  return (
    row.percepcao_coordenador && row.percepcao_coordenador.trim() !== '' &&
    row.motivo_procura && row.motivo_procura.trim() !== '' &&
    row.avaliacao_abaco && row.avaliacao_abaco.trim() !== '' &&
    row.avaliacao_ah && row.avaliacao_ah.trim() !== '' &&
    row.pontos_atencao && row.pontos_atencao.trim() !== ''
  );
}

export function useAulasInauguraisProfessor() {
  const { professorId, isProfessor } = useCurrentProfessor();
  const { isAdmin, isManagement } = useUserPermissions();
  const { activeUnit } = useActiveUnit();

  const isAdminOrManagement = isAdmin || isManagement;

  const { data, isLoading } = useQuery({
    queryKey: ['aulas-inaugurais-professor', professorId, isAdminOrManagement, activeUnit?.id],
    queryFn: async () => {
      if (isAdminOrManagement && activeUnit?.id) {
        const { data: aulas, error } = await (supabase as any)
          .from('aulas_inaugurais')
          .select('id, data, horario_inicio, horario_fim, status, client_id, atividade_pos_venda_id, percepcao_coordenador, motivo_procura, avaliacao_abaco, avaliacao_ah, pontos_atencao, professor_id')
          .eq('unit_id', activeUnit.id)
          .in('status', ['agendada', 'reagendada'])
          .order('data', { ascending: true });

        if (error) throw error;

        // Buscar nomes dos clientes e professores
        const atividadeIds = (aulas || []).map(a => a.atividade_pos_venda_id).filter(Boolean) as string[];
        const professorIds = (aulas || []).map(a => a.professor_id).filter(Boolean) as string[];

        let clienteNomes: Record<string, string> = {};
        let professorNomes: Record<string, string> = {};

        if (atividadeIds.length > 0) {
          const { data: atividades } = await supabase
            .from('atividade_pos_venda')
            .select('id, client_name, full_name')
            .in('id', atividadeIds);
          atividades?.forEach(a => {
            clienteNomes[a.id] = a.full_name || a.client_name;
          });
        }

        if (professorIds.length > 0) {
          const { data: profs } = await supabase
            .from('professores')
            .select('id, nome')
            .in('id', professorIds);
          profs?.forEach(p => {
            professorNomes[p.id] = p.nome;
          });
        }

        return (aulas || [])
          .filter(a => !isCompleted(a))
          .map(a => ({
            id: a.id,
            titulo: 'Aula Inaugural',
            data: a.data,
            horario_inicio: a.horario_inicio,
            horario_fim: a.horario_fim,
            descricao: null,
            cliente_nome: a.atividade_pos_venda_id ? clienteNomes[a.atividade_pos_venda_id] : undefined,
            professor_nome: a.professor_id ? professorNomes[a.professor_id] : undefined,
            client_id: a.client_id || undefined,
            atividade_pos_venda_id: a.atividade_pos_venda_id || undefined,
            status: a.status,
          })) as AulaInaugural[];
      }

      if (isProfessor && professorId) {
        const { data: aulas, error } = await (supabase as any)
          .from('aulas_inaugurais')
          .select('id, data, horario_inicio, horario_fim, status, client_id, atividade_pos_venda_id, percepcao_coordenador, motivo_procura, avaliacao_abaco, avaliacao_ah, pontos_atencao')
          .eq('professor_id', professorId)
          .in('status', ['agendada', 'reagendada'])
          .order('data', { ascending: true });

        if (error) throw error;

        const atividadeIds = (aulas || []).map(a => a.atividade_pos_venda_id).filter(Boolean) as string[];
        let clienteNomes: Record<string, string> = {};

        if (atividadeIds.length > 0) {
          const { data: atividades } = await supabase
            .from('atividade_pos_venda')
            .select('id, client_name, full_name')
            .in('id', atividadeIds);
          atividades?.forEach(a => {
            clienteNomes[a.id] = a.full_name || a.client_name;
          });
        }

        return (aulas || [])
          .filter(a => !isCompleted(a))
          .map(a => ({
            id: a.id,
            titulo: 'Aula Inaugural',
            data: a.data,
            horario_inicio: a.horario_inicio,
            horario_fim: a.horario_fim,
            descricao: null,
            cliente_nome: a.atividade_pos_venda_id ? clienteNomes[a.atividade_pos_venda_id] : undefined,
            client_id: a.client_id || undefined,
            atividade_pos_venda_id: a.atividade_pos_venda_id || undefined,
            status: a.status,
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

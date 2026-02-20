
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentProfessor } from './use-current-professor';
import { useUserPermissions } from './useUserPermissions';
import { useActiveUnit } from '@/contexts/ActiveUnitContext';

export interface PendenciaBotom {
  id: string;
  aluno_id: string;
  aluno_nome?: string;
  apostila_nova: string;
  apostila_anterior: string | null;
  professor_responsavel_id: string | null;
  professor_nome?: string;
  turma_nome?: string;
  status: 'pendente' | 'entregue';
  data_criacao: string;
  data_entrega: string | null;
  ignorado_ate?: string | null;
}

export function usePendenciasBotom() {
  const { professorId, isProfessor } = useCurrentProfessor();
  const { isAdmin, isManagement } = useUserPermissions();
  const { activeUnit } = useActiveUnit();
  const queryClient = useQueryClient();

  // Buscar pendências
  const { data: pendencias = [], isLoading, refetch } = useQuery({
    queryKey: ['pendencias-botom', professorId, isProfessor, isAdmin, isManagement, activeUnit?.id],
    queryFn: async () => {
      let query = supabase
        .from('pendencias_botom')
        .select(`
          id,
          aluno_id,
          apostila_nova,
          apostila_anterior,
          professor_responsavel_id,
          status,
          data_criacao,
          data_entrega,
          ignorado_ate
        `)
        .eq('status', 'pendente')
        .order('data_criacao', { ascending: false });

      // Se for professor, filtrar apenas as pendências dele
      if (isProfessor && professorId && !isAdmin && !isManagement) {
        query = query.eq('professor_responsavel_id', professorId);
      }

      const { data, error } = (await query) as unknown as { data: any[], error: any };
      if (error) throw error;

      // Enriquecer com dados do aluno e professor
      const enrichedData: PendenciaBotom[] = [];
      for (const p of data || []) {
        // Buscar nome do aluno (filtrando por unidade)
        const { data: aluno } = await supabase
          .from('alunos')
          .select('nome, turma_id, unit_id')
          .eq('id', p.aluno_id)
          .maybeSingle();

        // Filtrar por unidade ativa
        if (activeUnit?.id && aluno?.unit_id !== activeUnit.id) continue;

        // Buscar nome do professor
        let professorNome = '';
        if (p.professor_responsavel_id) {
          const { data: professor } = await supabase
            .from('professores')
            .select('nome')
            .eq('id', p.professor_responsavel_id)
            .maybeSingle();
          professorNome = professor?.nome || '';
        }

        // Buscar turma
        let turmaNome = '';
        if (aluno?.turma_id) {
          const { data: turma } = await supabase
            .from('turmas')
            .select('nome')
            .eq('id', aluno.turma_id)
            .maybeSingle();
          turmaNome = turma?.nome || '';
        }

        enrichedData.push({
          ...p,
          status: p.status as 'pendente' | 'entregue',
          aluno_nome: aluno?.nome || 'Aluno não encontrado',
          professor_nome: professorNome,
          turma_nome: turmaNome,
        });
      }

      // Filter out ignored ones from the view
      const now = new Date();
      const pendenciasNaoIgnoradas = enrichedData.filter(p => {
        if (!p.ignorado_ate) return true;
        const dataIgnorado = new Date(p.ignorado_ate);
        return dataIgnorado <= now;
      });

      return pendenciasNaoIgnoradas;
    },
    enabled: true,
  });

  // Mutation para confirmar entrega
  const confirmarEntrega = useMutation({
    mutationFn: async ({ pendenciaId, funcionarioRegistroId }: {
      pendenciaId: string;
      funcionarioRegistroId?: string;
    }) => {
      const { error } = await supabase
        .from('pendencias_botom')
        .update({
          status: 'entregue',
          data_entrega: new Date().toISOString(),
          funcionario_registro_id: funcionarioRegistroId || null
        })
        .eq('id', pendenciaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendencias-botom'] });
    },
  });

  const ignorarBotom = useMutation({
    mutationFn: async ({ pendenciaId, dias }: { pendenciaId: string; dias: number }) => {
      const ignorado_ate = new Date();
      ignorado_ate.setDate(ignorado_ate.getDate() + dias);

      const { error } = await supabase
        .from('pendencias_botom')
        .update({
          ignorado_ate: ignorado_ate.toISOString(),
        } as any)
        .eq('id', pendenciaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendencias-botom'] });
    },
  });

  return {
    pendencias,
    isLoading,
    refetch,
    confirmarEntrega: confirmarEntrega.mutateAsync,
    isConfirmando: confirmarEntrega.isPending,
    ignorarBotom: ignorarBotom.mutateAsync,
  };
}

// Hook para buscar pendências específicas de um aluno (para lembretes na sala de aula)
export function usePendenciasBotomAlunos(alunoIds: string[]) {
  return useQuery({
    queryKey: ['pendencias-botom-alunos', alunoIds],
    queryFn: async () => {
      if (alunoIds.length === 0) return {};

      const { data, error } = await supabase
        .from('pendencias_botom')
        .select('id, aluno_id, apostila_nova')
        .in('aluno_id', alunoIds)
        .eq('status', 'pendente');

      if (error) throw error;

      // Mapear por aluno_id (pegar primeiro se houver múltiplos)
      const map: Record<string, { pendenciaId: string; apostilaNova: string }> = {};
      for (const p of data || []) {
        if (!map[p.aluno_id]) {
          map[p.aluno_id] = {
            pendenciaId: p.id,
            apostilaNova: p.apostila_nova,
          };
        }
      }

      return map;
    },
    enabled: alunoIds.length > 0,
  });
}

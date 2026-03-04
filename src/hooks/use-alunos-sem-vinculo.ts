import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

export interface AlunoSemVinculo {
  id: string;
  nome: string;
  turma_nome: string | null;
}

export function useAlunosSemVinculo(currentAtividadeId?: string) {
  const { activeUnit } = useActiveUnit();

  return useQuery({
    queryKey: ["alunos-sem-vinculo", activeUnit?.id, currentAtividadeId],
    queryFn: async (): Promise<AlunoSemVinculo[]> => {
      // Buscar alunos ativos que não possuem atividade_pos_venda_id OU que já estão vinculados à atividade atual
      let query = supabase
        .from("alunos")
        .select(`
          id,
          nome,
          turma_id,
          atividade_pos_venda_id,
          turmas:turma_id (
            nome
          )
        `)
        .eq("active", true)
        .order("nome");

      // Filtrar por unidade se selecionada
      if (activeUnit?.id) {
        query = query.eq("unit_id", activeUnit.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (!data?.length) return [];

      // Filtrar apenas alunos sem vínculo OU vinculados à atividade atual
      const alunosFiltrados = data.filter((aluno: any) => {
        return aluno.atividade_pos_venda_id === null || aluno.atividade_pos_venda_id === currentAtividadeId;
      });

      return alunosFiltrados.map((aluno: any) => ({
        id: aluno.id,
        nome: aluno.nome,
        turma_nome: aluno.turmas?.nome || null,
      }));
    },
    enabled: true,
  });
}

// Hook para buscar o aluno atualmente vinculado a uma atividade_pos_venda
export function useAlunoVinculado(atividadePosVendaId?: string) {
  return useQuery({
    queryKey: ["aluno-vinculado", atividadePosVendaId],
    queryFn: async (): Promise<AlunoSemVinculo | null> => {
      if (!atividadePosVendaId) return null;

      const { data, error } = await supabase
        .from("alunos")
        .select(`
          id,
          nome,
          turma_id,
          turmas:turma_id (
            nome
          )
        `)
        .eq("atividade_pos_venda_id", atividadePosVendaId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        nome: data.nome,
        turma_nome: (data as any).turmas?.nome || null,
      };
    },
    enabled: !!atividadePosVendaId,
  });
}

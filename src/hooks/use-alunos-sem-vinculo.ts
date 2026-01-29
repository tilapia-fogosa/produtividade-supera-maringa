import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

export interface AlunoSemVinculo {
  id: string;
  nome: string;
  turma_nome: string | null;
}

export function useAlunosSemVinculo(currentClientId?: string) {
  const { activeUnit } = useActiveUnit();

  return useQuery({
    queryKey: ["alunos-sem-vinculo", activeUnit?.id, currentClientId],
    queryFn: async (): Promise<AlunoSemVinculo[]> => {
      // Buscar alunos ativos que não possuem client_id OU que já estão vinculados ao client atual
      let query = supabase
        .from("alunos")
        .select(`
          id,
          nome,
          turma_id,
          client_id,
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

      // Filtrar apenas alunos sem vínculo OU vinculados ao client atual
      const alunosFiltrados = data.filter((aluno: any) => {
        return aluno.client_id === null || aluno.client_id === currentClientId;
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

// Hook para buscar o aluno atualmente vinculado a um client
export function useAlunoVinculado(clientId?: string) {
  return useQuery({
    queryKey: ["aluno-vinculado", clientId],
    queryFn: async (): Promise<AlunoSemVinculo | null> => {
      if (!clientId) return null;

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
        .eq("client_id", clientId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        nome: data.nome,
        turma_nome: (data as any).turmas?.nome || null,
      };
    },
    enabled: !!clientId,
  });
}

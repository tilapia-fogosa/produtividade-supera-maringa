import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AlunoTurma {
  id: string;
  nome: string;
  active: boolean;
}

export const useAlunosTurma = (turmaId: string | null) => {
  return useQuery({
    queryKey: ["alunos-turma", turmaId],
    queryFn: async () => {
      if (!turmaId) return [];
      
      const { data, error } = await supabase
        .from('alunos')
        .select('id, nome, active')
        .eq('turma_id', turmaId)
        .eq('active', true)
        .order('nome');

      if (error) {
        console.error("Erro ao buscar alunos da turma:", error);
        throw error;
      }

      return data as AlunoTurma[];
    },
    enabled: !!turmaId,
  });
};
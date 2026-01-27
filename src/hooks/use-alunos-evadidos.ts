import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

export interface AlunoEvadido {
  id: string;
  aluno_id: string;
  aluno_nome: string;
  turma_nome: string | null;
  professor_nome: string | null;
  data_alerta: string;
  data_evasao: string;
  origem_alerta: string;
  descritivo: string | null;
}

export function useAlunosEvadidos() {
  const { activeUnit } = useActiveUnit();

  return useQuery({
    queryKey: ["alunos-evadidos", activeUnit?.id],
    queryFn: async (): Promise<AlunoEvadido[]> => {
      // Buscar alertas com status 'evadido'
      const { data: alertas, error } = await supabase
        .from("alerta_evasao")
        .select(`
          id,
          aluno_id,
          data_alerta,
          updated_at,
          origem_alerta,
          descritivo,
          alunos!alerta_evasao_aluno_id_fkey (
            id,
            nome,
            unit_id,
            turma_id,
            turmas!fk_alunos_turma_id (
              id,
              nome,
              professor_id,
              professores!turmas_professor_fkey (
                id,
                nome
              )
            )
          )
        `)
        .eq("status", "evadido")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      if (!alertas?.length) return [];

      // Filtrar por unidade
      const filteredAlertas = activeUnit?.id
        ? alertas.filter((a: any) => a.alunos?.unit_id === activeUnit.id)
        : alertas;

      return filteredAlertas.map((alerta: any) => ({
        id: alerta.id,
        aluno_id: alerta.aluno_id,
        aluno_nome: alerta.alunos?.nome || "Aluno não encontrado",
        turma_nome: alerta.alunos?.turmas?.nome || null,
        professor_nome: alerta.alunos?.turmas?.professores?.nome || null,
        data_alerta: alerta.data_alerta,
        data_evasao: alerta.updated_at,
        origem_alerta: alerta.origem_alerta,
        descritivo: alerta.descritivo,
      }));
    },
    enabled: true,
  });
}

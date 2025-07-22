import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TurmaModalData = {
  turma: {
    id: string;
    nome: string;
    sala: string;
    dia_semana: string;
    horario_inicio?: string;
    horario_fim?: string;
  };
  professor: {
    id: string;
    nome: string;
    slack_username: string;
  };
  alunos: Array<{
    id: string;
    nome: string;
    idade: number;
    dias_supera: number;
    foto_url: string | null;
    telefone?: string;
    email?: string;
  }>;
  estatisticas: {
    total_alunos_ativos: number;
    media_idade: number;
    media_dias_supera: number;
  };
};

export const useTurmaModal = (turmaId: string | null) => {
  return useQuery({
    queryKey: ["turma-modal", turmaId],
    queryFn: async () => {
      if (!turmaId) return null;
      
      const { data, error } = await supabase.rpc("get_turma_modal_data", {
        p_turma_id: turmaId
      });
      
      if (error) {
        console.error("Erro ao buscar dados da turma:", error);
        throw error;
      }
      
      return data as TurmaModalData;
    },
    enabled: !!turmaId,
  });
};
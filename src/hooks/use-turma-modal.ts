import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TurmaModalData = {
  turma: {
    id: string;
    nome: string;
    sala: string;
    dia_semana: string;
    unit_id?: string;
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
  reposicoes: Array<{
    id: string;
    nome: string;
    idade: number;
    dias_supera: number;
    foto_url: string | null;
    telefone?: string;
    email?: string;
    data_reposicao: string;
    motivo?: string;
  }>;
  estatisticas: {
    total_alunos_ativos: number;
    total_reposicoes_dia: number;
    media_idade: number;
    media_dias_supera: number;
  };
};

export const useTurmaModal = (turmaId: string | null, dataConsulta?: Date) => {
  return useQuery({
    queryKey: ["turma-modal", turmaId, dataConsulta?.toISOString().split('T')[0]],
    queryFn: async () => {
      if (!turmaId) return null;
      
      const params: any = { p_turma_id: turmaId };
      if (dataConsulta) {
        params.p_data_consulta = dataConsulta.toISOString().split('T')[0];
      }
      
      const { data, error } = await supabase.rpc("get_turma_modal_data", params);
      
      if (error) {
        console.error("Erro ao buscar dados da turma:", error);
        throw error;
      }
      
      return data as TurmaModalData;
    },
    enabled: !!turmaId,
  });
};
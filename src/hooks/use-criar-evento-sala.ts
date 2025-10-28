import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type CriarEventoSalaParams = {
  sala_id: string;
  tipo_evento: string;
  titulo: string;
  descricao?: string;
  data: string;
  horario_inicio: string;
  horario_fim: string;
  responsavel_id: string;
  responsavel_tipo: string;
  recorrente: boolean;
  tipo_recorrencia?: string;
  dia_semana?: string;
  dia_mes?: number;
  data_inicio_recorrencia?: string;
  data_fim_recorrencia?: string;
  unit_id?: string;
};

export const useCriarEventoSala = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CriarEventoSalaParams) => {
      // Validar conflito de horário antes de criar
      const { data: temConflito, error: errorConflito } = await supabase.rpc(
        "verificar_conflito_sala",
        {
          p_sala_id: params.sala_id,
          p_data: params.data,
          p_horario_inicio: params.horario_inicio,
          p_horario_fim: params.horario_fim,
        }
      );

      if (errorConflito) throw errorConflito;
      if (temConflito) {
        throw new Error("Já existe um evento ou turma agendada neste horário");
      }

      // Criar evento
      const { data, error } = await supabase
        .from("eventos_sala")
        .insert([{
          sala_id: params.sala_id,
          tipo_evento: params.tipo_evento,
          titulo: params.titulo,
          descricao: params.descricao || null,
          data: params.data,
          horario_inicio: params.horario_inicio,
          horario_fim: params.horario_fim,
          responsavel_id: params.responsavel_id,
          responsavel_tipo: params.responsavel_tipo,
          recorrente: params.recorrente,
          tipo_recorrencia: params.recorrente ? params.tipo_recorrencia || null : null,
          dia_semana: params.recorrente && params.tipo_recorrencia !== 'mensal' ? params.dia_semana || null : null,
          dia_mes: params.recorrente && params.tipo_recorrencia === 'mensal' ? params.dia_mes || null : null,
          data_inicio_recorrencia: params.recorrente ? params.data_inicio_recorrencia || null : null,
          data_fim_recorrencia: params.recorrente ? params.data_fim_recorrencia || null : null,
          unit_id: params.unit_id || null,
        } as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["horarios-disponiveis-salas"] });
      queryClient.invalidateQueries({ queryKey: ["calendario-turmas"] });
    },
    onError: (error: Error) => {
      console.error('Erro ao criar reserva:', error);
      throw error;
    },
  });
};

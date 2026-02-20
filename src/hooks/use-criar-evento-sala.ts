import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Função auxiliar para calcular duração em minutos
const calcularDuracaoMinutos = (inicio: string, fim: string): number => {
  const [horaInicio, minutoInicio] = inicio.split(':').map(Number);
  const [horaFim, minutoFim] = fim.split(':').map(Number);
  return (horaFim * 60 + minutoFim) - (horaInicio * 60 + minutoInicio);
};

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
  unit_id: string;
  funcionario_registro_id?: string;
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

      // Criar evento de sala
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
          unit_id: params.unit_id,
        } as any])
        .select()
        .single();

      if (error) throw error;

      // Se o responsável é um professor, criar bloqueio no horário do professor
      if (params.responsavel_tipo === 'professor' && data) {
        const { error: errorProfessor } = await supabase
          .from("eventos_professor")
          .insert([{
            professor_id: params.responsavel_id,
            tipo_evento: 'bloqueio_sala',
            titulo: params.titulo,
            descricao: params.descricao || null,
            data: params.data,
            horario_inicio: params.horario_inicio,
            duracao_minutos: calcularDuracaoMinutos(params.horario_inicio, params.horario_fim),
            recorrente: params.recorrente,
            tipo_recorrencia: params.recorrente ? params.tipo_recorrencia || null : null,
            dia_semana: params.recorrente && params.tipo_recorrencia !== 'mensal' ? params.dia_semana || null : null,
            dia_mes: params.recorrente && params.tipo_recorrencia === 'mensal' ? params.dia_mes || null : null,
            data_inicio_recorrencia: params.recorrente ? params.data_inicio_recorrencia || null : null,
            data_fim_recorrencia: params.recorrente ? params.data_fim_recorrencia || null : null,
            evento_sala_id: data.id,
          } as any])
          .select()
          .single();

        if (errorProfessor) {
          console.error('Erro ao criar bloqueio do professor:', errorProfessor);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["horarios-disponiveis-salas"] });
      queryClient.invalidateQueries({ queryKey: ["calendario-turmas"] });
      queryClient.invalidateQueries({ queryKey: ["bloqueios-professor"] });
      queryClient.invalidateQueries({ queryKey: ["bloqueios-sala"] });
      queryClient.invalidateQueries({ queryKey: ["calendario-eventos-unificados"] });
    },
    onError: (error: Error) => {
      console.error('Erro ao criar reserva:', error);
      throw error;
    },
  });
};

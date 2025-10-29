import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CriarEventoProfessorParams = {
  professorId: string;
  tipoEvento: string;
  titulo: string;
  descricao?: string;
  data?: Date;
  horarioInicio: string;
  duracaoMinutos: number;
  recorrente: boolean;
  tipoRecorrencia?: 'semanal' | 'mensal';
  diaSemana?: string;
  dataInicioRecorrencia?: Date;
  dataFimRecorrencia?: Date;
  unitId: string;
};

export const useCriarEventoProfessor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: CriarEventoProfessorParams) => {
      // Calcular horário fim
      const [hora, minuto] = params.horarioInicio.split(':').map(Number);
      const totalMinutos = hora * 60 + minuto + params.duracaoMinutos;
      const horarioFim = `${String(Math.floor(totalMinutos / 60)).padStart(2, '0')}:${String(totalMinutos % 60).padStart(2, '0')}`;
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");
      
      const eventData: any = {
        professor_id: params.professorId,
        tipo_evento: params.tipoEvento,
        titulo: params.titulo,
        descricao: params.descricao,
        horario_inicio: params.horarioInicio,
        horario_fim: horarioFim,
        recorrente: params.recorrente,
        unit_id: params.unitId,
        created_by: user.user.id
      };
      
      if (params.recorrente) {
        eventData.tipo_recorrencia = params.tipoRecorrencia;
        eventData.dia_semana = params.diaSemana;
        eventData.data_inicio_recorrencia = params.dataInicioRecorrencia?.toISOString().split('T')[0];
        eventData.data_fim_recorrencia = params.dataFimRecorrencia?.toISOString().split('T')[0];
      } else {
        eventData.data = params.data?.toISOString().split('T')[0];
      }
      
      const { error } = await supabase
        .from('eventos_professor')
        .insert(eventData);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agenda-professores"] });
    }
  });
};

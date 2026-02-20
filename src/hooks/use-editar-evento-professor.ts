import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type EditarEventoProfessorParams = {
  eventoId: string;
  tipoEvento?: string;
  titulo?: string;
  descricao?: string;
  horarioInicio?: string;
  duracaoMinutos?: number;
};

export const useEditarEventoProfessor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: EditarEventoProfessorParams) => {
      const updateData: any = {};
      
      if (params.tipoEvento !== undefined) updateData.tipo_evento = params.tipoEvento;
      if (params.titulo !== undefined) updateData.titulo = params.titulo;
      if (params.descricao !== undefined) updateData.descricao = params.descricao;
      
      // Se horário ou duração mudaram, recalcular horário fim
      if (params.horarioInicio !== undefined || params.duracaoMinutos !== undefined) {
        // Buscar evento atual para pegar valores que faltam
        const { data: eventoAtual, error: fetchError } = await supabase
          .from('eventos_professor')
          .select('horario_inicio, horario_fim')
          .eq('id', params.eventoId)
          .single();
        
        if (fetchError) throw fetchError;
        
        const horarioInicio = params.horarioInicio || eventoAtual.horario_inicio;
        
        // Calcular duração atual se não foi fornecida
        let duracao = params.duracaoMinutos;
        if (!duracao) {
          const [horaIni, minIni] = eventoAtual.horario_inicio.split(':').map(Number);
          const [horaFim, minFim] = eventoAtual.horario_fim.split(':').map(Number);
          duracao = (horaFim * 60 + minFim) - (horaIni * 60 + minIni);
        }
        
        // Calcular novo horário fim
        const [hora, minuto] = horarioInicio.split(':').map(Number);
        const totalMinutos = hora * 60 + minuto + duracao;
        const horarioFim = `${String(Math.floor(totalMinutos / 60)).padStart(2, '0')}:${String(totalMinutos % 60).padStart(2, '0')}`;
        
        updateData.horario_inicio = horarioInicio;
        updateData.horario_fim = horarioFim;
      }
      
      const { error } = await supabase
        .from('eventos_professor')
        .update(updateData)
        .eq('id', params.eventoId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agenda-professores"] });
    }
  });
};

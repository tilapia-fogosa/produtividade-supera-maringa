import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Função auxiliar para calcular duração em minutos
const calcularDuracaoMinutos = (inicio: string, fim: string): number => {
  const [horaInicio, minutoInicio] = inicio.split(':').map(Number);
  const [horaFim, minutoFim] = fim.split(':').map(Number);
  return (horaFim * 60 + minutoFim) - (horaInicio * 60 + minutoInicio);
};

type EditarEventoSalaParams = {
  id: string;
  sala_id?: string;
  tipo_evento?: string;
  titulo?: string;
  descricao?: string;
  data?: string;
  horario_inicio?: string;
  horario_fim?: string;
  responsavel_id?: string;
  responsavel_tipo?: string;
  recorrente?: boolean;
  tipo_recorrencia?: string;
  dia_semana?: string;
  dia_mes?: number;
  data_inicio_recorrencia?: string;
  data_fim_recorrencia?: string;
};

export const useEditarEventoSala = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: EditarEventoSalaParams) => {
      console.log('✏️ Editando evento de sala:', params.id);

      // Buscar dados atuais do evento
      const { data: eventoAtual, error: errorBusca } = await supabase
        .from("eventos_sala")
        .select("responsavel_tipo, responsavel_id, horario_inicio, horario_fim")
        .eq("id", params.id)
        .single();

      if (errorBusca) throw errorBusca;

      // Atualizar evento de sala
      const { data, error } = await supabase
        .from("eventos_sala")
        .update({
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
        } as any)
        .eq("id", params.id)
        .select()
        .single();

      if (error) throw error;

      // Gerenciar evento de professor associado
      const responsavelTipoAtual = eventoAtual.responsavel_tipo;
      const responsavelTipoNovo = params.responsavel_tipo;
      const responsavelIdNovo = params.responsavel_id;

      // Buscar evento de professor existente
      const resultadoEventoProfessor = await (supabase as any)
        .from("eventos_professor")
        .select("id")
        .eq("evento_sala_id", params.id)
        .maybeSingle();
      
      const eventoProfessorExistente = resultadoEventoProfessor.data as { id: string } | null;

      // Caso 1: Responsável era professor e continua sendo professor
      if (responsavelTipoAtual === 'professor' && responsavelTipoNovo === 'professor') {
        if (eventoProfessorExistente) {
          // Calcular duração
          let duracaoMinutos = 60;
          if (params.horario_inicio && params.horario_fim) {
            duracaoMinutos = calcularDuracaoMinutos(params.horario_inicio, params.horario_fim);
          } else if (eventoAtual.horario_inicio && eventoAtual.horario_fim) {
            duracaoMinutos = calcularDuracaoMinutos(eventoAtual.horario_inicio, eventoAtual.horario_fim);
          }

          // Atualizar evento existente
          await supabase
            .from("eventos_professor")
            .update({
              professor_id: responsavelIdNovo,
              titulo: params.titulo,
              descricao: params.descricao || null,
              data: params.data,
              horario_inicio: params.horario_inicio,
              duracao_minutos: duracaoMinutos,
              recorrente: params.recorrente,
              tipo_recorrencia: params.recorrente ? params.tipo_recorrencia || null : null,
              dia_semana: params.recorrente && params.tipo_recorrencia !== 'mensal' ? params.dia_semana || null : null,
              dia_mes: params.recorrente && params.tipo_recorrencia === 'mensal' ? params.dia_mes || null : null,
              data_inicio_recorrencia: params.recorrente ? params.data_inicio_recorrencia || null : null,
              data_fim_recorrencia: params.recorrente ? params.data_fim_recorrencia || null : null,
            } as any)
            .eq("id", eventoProfessorExistente.id);
        }
      }
      // Caso 2: Responsável não era professor mas agora é
      else if (responsavelTipoAtual !== 'professor' && responsavelTipoNovo === 'professor') {
        // Criar novo evento de professor
        await supabase
          .from("eventos_professor")
          .insert([{
            professor_id: responsavelIdNovo,
            tipo_evento: 'bloqueio_sala',
            titulo: params.titulo,
            descricao: params.descricao || null,
            data: params.data,
            horario_inicio: params.horario_inicio,
            duracao_minutos: params.horario_inicio && params.horario_fim 
              ? calcularDuracaoMinutos(params.horario_inicio, params.horario_fim)
              : 60,
            recorrente: params.recorrente,
            tipo_recorrencia: params.recorrente ? params.tipo_recorrencia || null : null,
            dia_semana: params.recorrente && params.tipo_recorrencia !== 'mensal' ? params.dia_semana || null : null,
            dia_mes: params.recorrente && params.tipo_recorrencia === 'mensal' ? params.dia_mes || null : null,
            data_inicio_recorrencia: params.recorrente ? params.data_inicio_recorrencia || null : null,
            data_fim_recorrencia: params.recorrente ? params.data_fim_recorrencia || null : null,
            evento_sala_id: params.id,
          } as any]);
      }
      // Caso 3: Responsável era professor mas agora não é mais
      else if (responsavelTipoAtual === 'professor' && responsavelTipoNovo !== 'professor') {
        // Excluir evento de professor existente
        if (eventoProfessorExistente) {
          await supabase
            .from("eventos_professor")
            .delete()
            .eq("id", eventoProfessorExistente.id);
        }
      }

      console.log('✅ Evento de sala editado com sucesso');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bloqueios-sala"] });
      queryClient.invalidateQueries({ queryKey: ["bloqueios-professor"] });
      queryClient.invalidateQueries({ queryKey: ["calendario-turmas"] });
      queryClient.invalidateQueries({ queryKey: ["horarios-disponiveis-salas"] });
    },
    onError: (error: Error) => {
      console.error('❌ Erro ao editar evento de sala:', error);
      throw error;
    },
  });
};

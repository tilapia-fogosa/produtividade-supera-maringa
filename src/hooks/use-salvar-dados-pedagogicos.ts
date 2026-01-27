import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SalvarDadosPedagogicosParams = {
  clientId: string;
  turmaId?: string;
  responsavel?: string;
  whatsappContato?: string;
  dataAulaInaugural?: Date;
  horarioAulaInaugural?: string;
  professorId?: string;
  salaId?: string;
};

export const useSalvarDadosPedagogicos = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SalvarDadosPedagogicosParams) => {
      // 1. Atualizar atividade_pos_venda
      const updateData: Record<string, unknown> = {};
      
      if (params.turmaId) updateData.turma_id = params.turmaId;
      if (params.responsavel) updateData.responsavel = params.responsavel;
      if (params.whatsappContato) updateData.whatsapp_contato = params.whatsappContato;
      
      if (params.dataAulaInaugural && params.horarioAulaInaugural) {
        // Combinar data e horário para o campo data_aula_inaugural
        const dataStr = params.dataAulaInaugural.toISOString().split('T')[0];
        const dataHoraCompleta = `${dataStr}T${params.horarioAulaInaugural}:00`;
        updateData.data_aula_inaugural = dataHoraCompleta;
      }

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('atividade_pos_venda')
          .update(updateData)
          .eq('client_id', params.clientId);

        if (updateError) throw updateError;
      }

      // 2. Criar evento na agenda do professor (se tiver aula inaugural agendada)
      if (params.dataAulaInaugural && params.horarioAulaInaugural && params.professorId) {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id ?? null;

        // Calcular horário fim (1 hora de duração)
        const [hora, minuto] = params.horarioAulaInaugural.split(':').map(Number);
        const totalMinutos = hora * 60 + minuto + 60;
        const horarioFim = `${String(Math.floor(totalMinutos / 60)).padStart(2, '0')}:${String(totalMinutos % 60).padStart(2, '0')}`;

        const eventoData = {
          professor_id: params.professorId,
          tipo_evento: 'aula_zero',
          titulo: 'Aula Inaugural',
          descricao: `Aula inaugural agendada via painel administrativo`,
          data: params.dataAulaInaugural.toISOString().split('T')[0],
          horario_inicio: params.horarioAulaInaugural,
          horario_fim: horarioFim,
          recorrente: false,
          created_by: userId,
        };

        const { error: eventoError } = await supabase
          .from('eventos_professor')
          .insert(eventoData);

        if (eventoError) throw eventoError;
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-matricula"] });
      queryClient.invalidateQueries({ queryKey: ["agenda-professores"] });
    }
  });
};

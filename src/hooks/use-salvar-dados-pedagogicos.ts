import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SalvarDadosPedagogicosParams = {
  clientId: string;
  alunoId?: string; // ID do aluno vinculado
  turmaId?: string;
  responsavel?: string;
  whatsappContato?: string;
  dataAulaInaugural?: Date;
  horarioAulaInaugural?: string;
  professorId?: string;
  salaId?: string;
  // Valores para webhook - sempre os valores atuais do formulário
  responsavelWebhook?: string;
  telefoneResponsavelWebhook?: string;
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
      
      let dataAulaInauguralISO: string | null = null;
      if (params.dataAulaInaugural && params.horarioAulaInaugural) {
        // Combinar data e horário para o campo data_aula_inaugural
        const dataStr = params.dataAulaInaugural.toISOString().split('T')[0];
        const dataHoraCompleta = `${dataStr}T${params.horarioAulaInaugural}:00`;
        updateData.data_aula_inaugural = dataHoraCompleta;
        dataAulaInauguralISO = dataStr;
      }

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('atividade_pos_venda')
          .update(updateData)
          .eq('client_id', params.clientId);

        if (updateError) throw updateError;
      }

      // 2. Se tiver aluno vinculado, atualizar também a tabela alunos
      if (params.alunoId) {
        const alunoUpdateData: Record<string, unknown> = {};
        
        if (params.turmaId) alunoUpdateData.turma_id = params.turmaId;
        if (params.responsavel) alunoUpdateData.responsavel = params.responsavel;
        if (params.whatsappContato) alunoUpdateData.whatapp_contato = params.whatsappContato;
        if (dataAulaInauguralISO) alunoUpdateData.data_onboarding = dataAulaInauguralISO;

        if (Object.keys(alunoUpdateData).length > 0) {
          const { error: alunoError } = await supabase
            .from('alunos')
            .update(alunoUpdateData)
            .eq('id', params.alunoId);

          if (alunoError) {
            console.error("Erro ao atualizar aluno:", alunoError);
          }
        }
      }

      // 3. Criar evento na agenda do professor (se tiver aula inaugural agendada)
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

      // 4. Enviar webhook com dados do aluno para sincronização de contatos
      try {
        // Buscar dados do aluno
        let nomeAluno = '';
        let telefoneAluno = '';
        
        if (params.alunoId) {
          const { data: alunoData } = await supabase
            .from('alunos')
            .select('nome, telefone')
            .eq('id', params.alunoId)
            .maybeSingle();
          
          if (alunoData) {
            nomeAluno = alunoData.nome || '';
            telefoneAluno = alunoData.telefone || '';
          }
        }

        // Buscar nome da turma
        let nomeTurma = '';
        if (params.turmaId) {
          const { data: turmaData } = await supabase
            .from('turmas')
            .select('nome')
            .eq('id', params.turmaId)
            .maybeSingle();
          
          if (turmaData) {
            nomeTurma = turmaData.nome || '';
          }
        }

        const webhookPayload = {
          nome_aluno: nomeAluno,
          telefone_aluno: telefoneAluno,
          turma: nomeTurma,
          responsavel: params.responsavelWebhook || '',
          telefone_responsavel: params.telefoneResponsavelWebhook || ''
        };

        console.log('[Webhook Contatos Google] Enviando payload:', webhookPayload);

        await fetch('https://webhookn8n.agenciakadin.com.br/webhook/contatos-google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload),
        });

        console.log('[Webhook Contatos Google] Enviado com sucesso');
      } catch (webhookError) {
        console.error('[Webhook Contatos Google] Erro ao enviar:', webhookError);
        // Não propagar o erro do webhook para não impedir o salvamento
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-matricula"] });
      queryClient.invalidateQueries({ queryKey: ["agenda-professores"] });
      queryClient.invalidateQueries({ queryKey: ["aluno-vinculado"] });
      queryClient.invalidateQueries({ queryKey: ["atividades-pos-venda"] });
    }
  });
};


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface KanbanCard {
  id: string;
  alerta_evasao_id: string;
  column_id: string;  // 'todo' | 'doing' | 'scheduled' | 'done' | 'hibernating'
  title: string;
  description: string | null;
  aluno_nome: string | null;
  origem: string | null;
  responsavel: string | null;
  created_at: string;
  updated_at: string;
  historico?: string | null;
  priority?: string;
  due_date?: string | null;
  attached_files?: any[];
  comments?: any[];
  tags?: string[];
  last_activity?: string;
  retention_date?: string | null;
  resultado?: 'evadiu' | 'retido' | null;
}

export const useKanbanCards = (showHibernating: boolean = false) => {
  const queryClient = useQueryClient();

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['kanban-cards', { showHibernating }],
    queryFn: async () => {
      let query = supabase
        .from('kanban_cards')
        .select('*');

      if (showHibernating) {
        query = query.eq('column_id', 'hibernating');
      } else {
        query = query.neq('column_id', 'hibernating');
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar cards:', error);
        throw error;
      }

      console.log('Cards carregados:', data);
      return data as KanbanCard[];
    }
  });

  const updateCardColumn = useMutation({
    mutationFn: async ({ cardId, newColumnId }: { cardId: string; newColumnId: string }) => {
      console.log(`Atualizando card ${cardId} para coluna ${newColumnId}`);
      
      const { error, data } = await supabase
        .from('kanban_cards')
        .update({ column_id: newColumnId })
        .eq('id', cardId)
        .select();

      if (error) {
        console.error('Erro ao atualizar coluna:', error);
        throw error;
      }
      
      console.log('Atualização concluída:', data);
      return data;
    },
    onSuccess: () => {
      console.log('Invalidando cache após atualização de coluna');
      queryClient.invalidateQueries({ queryKey: ['kanban-cards'] });
    },
    onError: (error) => {
      console.error('Erro na mutação de atualização de coluna:', error);
    }
  });

  const updateCard = useMutation({
    mutationFn: async (updateData: { 
      cardId: string; 
      title: string;
      description: string;
      responsavel: string;
      priority?: string;
      due_date?: string | null;
      tags?: string[];
      column_id?: string;
      historico?: string | null;
    }) => {
      console.log('Atualizando card:', updateData);
      
      const { cardId, ...dataToUpdate } = updateData;
      
      const { error, data } = await supabase
        .from('kanban_cards')
        .update(dataToUpdate)
        .eq('id', cardId)
        .select();

      if (error) {
        console.error('Erro ao atualizar card:', error);
        throw error;
      }
      
      console.log('Card atualizado:', data);
      return data;
    },
    onSuccess: () => {
      console.log('Invalidando cache após atualização de card');
      queryClient.invalidateQueries({ queryKey: ['kanban-cards'] });
    },
    onError: (error) => {
      console.error('Erro na mutação de atualização de card:', error);
    }
  });

  const finalizarAlerta = useMutation({
    mutationFn: async ({ 
      cardId, 
      alertaId, 
      resultado, 
      alunoNome 
    }: { 
      cardId: string; 
      alertaId: string; 
      resultado: 'evadiu' | 'retido';
      alunoNome?: string | null;
    }) => {
      console.log(`Finalizando alerta ${alertaId} com resultado: ${resultado}`);
      
      const dataHora = new Date().toLocaleString('pt-BR');
      const mensagemHistorico = `${dataHora} - Alerta finalizado como: ${resultado === 'evadiu' ? 'EVADIDO' : 'RETIDO'}`;
      
      // Primeiro, busca o card atual para obter o histórico existente
      const { data: cardAtual, error: erroCard } = await supabase
        .from('kanban_cards')
        .select('historico')
        .eq('id', cardId)
        .single();
        
      if (erroCard) {
        console.error('Erro ao buscar card para finalização:', erroCard);
        throw erroCard;
      }
      
      // Atualiza o histórico concatenando a nova mensagem
      const historicoAtualizado = cardAtual.historico 
        ? `${cardAtual.historico}\n\n${mensagemHistorico}` 
        : mensagemHistorico;
      
      // Atualiza o card com o resultado e o histórico
      const { error: errorCard } = await supabase
        .from('kanban_cards')
        .update({ 
          resultado,
          historico: historicoAtualizado,
          column_id: 'done' // Move para coluna "Concluído"
        })
        .eq('id', cardId);

      if (errorCard) {
        console.error('Erro ao finalizar card:', errorCard);
        throw errorCard;
      }
      
      // Atualiza o alerta na tabela alerta_evasao
      const { error: errorAlerta } = await supabase
        .from('alerta_evasao')
        .update({ 
          status: 'resolvido',
          kanban_status: 'done'
        })
        .eq('id', alertaId);

      if (errorAlerta) {
        console.error('Erro ao atualizar alerta de evasão:', errorAlerta);
        throw errorAlerta;
      }
      
      return { resultado, alunoNome };
    },
    onSuccess: (data) => {
      console.log('Alerta finalizado com sucesso:', data);
      const mensagem = data.resultado === 'evadiu' 
        ? `${data.alunoNome || 'Aluno'} marcado como evadido`
        : `${data.alunoNome || 'Aluno'} marcado como retido`;
      
      toast.success(mensagem);
      queryClient.invalidateQueries({ queryKey: ['kanban-cards'] });
    },
    onError: (error) => {
      console.error('Erro ao finalizar alerta:', error);
      toast.error('Erro ao finalizar o alerta');
    }
  });

  return {
    cards,
    isLoading,
    updateCardColumn,
    updateCard,
    finalizarAlerta
  };
};

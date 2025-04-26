
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface KanbanCard {
  id: string;
  alerta_evasao_id: string;
  column_id: string;  // 'todo' | 'doing' | 'scheduled' | 'done'
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
}

export const useKanbanCards = () => {
  const queryClient = useQueryClient();

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['kanban-cards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kanban_cards')
        .select('*')
        .order('created_at', { ascending: false });

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
      comments?: any[];
      attached_files?: any[];
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

  return {
    cards,
    isLoading,
    updateCardColumn,
    updateCard
  };
};

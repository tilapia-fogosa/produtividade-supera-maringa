
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

      return data as KanbanCard[];
    }
  });

  const updateCardColumn = useMutation({
    mutationFn: async ({ cardId, newColumnId }: { cardId: string; newColumnId: string }) => {
      const { error } = await supabase
        .from('kanban_cards')
        .update({ column_id: newColumnId })
        .eq('id', cardId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-cards'] });
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
      comments?: any[];
      attached_files?: any[];
    }) => {
      const { error } = await supabase
        .from('kanban_cards')
        .update({
          title: updateData.title,
          description: updateData.description,
          responsavel: updateData.responsavel,
          priority: updateData.priority,
          due_date: updateData.due_date,
          tags: updateData.tags,
          comments: updateData.comments,
          attached_files: updateData.attached_files
        })
        .eq('id', updateData.cardId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-cards'] });
    }
  });

  return {
    cards,
    isLoading,
    updateCardColumn,
    updateCard
  };
};

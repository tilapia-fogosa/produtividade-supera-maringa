import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TarefaPessoal {
  id: string;
  user_id: string;
  titulo: string;
  descricao: string | null;
  data_vencimento: string;
  concluida: boolean;
  prioridade: 'baixa' | 'normal' | 'alta';
  created_at: string;
  updated_at: string;
}

export function useTarefasPessoais(dataInicio?: string, dataFim?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['tarefas-pessoais', user?.id, dataInicio, dataFim],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let queryBuilder = supabase
        .from('tarefas_pessoais')
        .select('*')
        .eq('user_id', user.id)
        .order('data_vencimento', { ascending: true });

      if (dataInicio) {
        queryBuilder = queryBuilder.gte('data_vencimento', dataInicio);
      }
      if (dataFim) {
        queryBuilder = queryBuilder.lte('data_vencimento', dataFim);
      }

      const { data, error } = await queryBuilder;
      
      if (error) throw error;
      return data as TarefaPessoal[];
    },
    enabled: !!user?.id,
  });

  const criarTarefa = useMutation({
    mutationFn: async (tarefa: Omit<TarefaPessoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('tarefas_pessoais')
        .insert({
          ...tarefa,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas-pessoais'] });
    },
  });

  const atualizarTarefa = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TarefaPessoal> & { id: string }) => {
      const { data, error } = await supabase
        .from('tarefas_pessoais')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas-pessoais'] });
    },
  });

  const deletarTarefa = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tarefas_pessoais')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas-pessoais'] });
    },
  });

  const toggleConcluida = useMutation({
    mutationFn: async ({ id, concluida }: { id: string; concluida: boolean }) => {
      const { data, error } = await supabase
        .from('tarefas_pessoais')
        .update({ concluida })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas-pessoais'] });
    },
  });

  return {
    tarefas: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    criarTarefa,
    atualizarTarefa,
    deletarTarefa,
    toggleConcluida,
  };
}

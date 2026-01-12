import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActiveUnit } from '@/contexts/ActiveUnitContext';

export interface GaleriaTag {
  id: string;
  nome: string;
  cor: string;
  unit_id: string;
  created_at: string;
}

interface CreateTagInput {
  nome: string;
  cor: string;
}

interface UpdateTagInput {
  id: string;
  nome?: string;
  cor?: string;
}

export function useGaleriaTags() {
  const { activeUnit } = useActiveUnit();
  const queryClient = useQueryClient();

  const tagsQuery = useQuery({
    queryKey: ['galeria-tags', activeUnit],
    queryFn: async () => {
      if (!activeUnit) return [];
      
      const { data, error } = await supabase
        .from('galeria_tags')
        .select('*')
        .eq('unit_id', activeUnit.id)
        .order('nome', { ascending: true });

      if (error) throw error;
      return data as GaleriaTag[];
    },
    enabled: !!activeUnit
  });

  const createTagMutation = useMutation({
    mutationFn: async (input: CreateTagInput) => {
      if (!activeUnit?.id) throw new Error('Unidade não selecionada');

      const { data, error } = await supabase
        .from('galeria_tags')
        .insert({
          nome: input.nome,
          cor: input.cor,
          unit_id: activeUnit.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galeria-tags'] });
    }
  });

  const updateTagMutation = useMutation({
    mutationFn: async (input: UpdateTagInput) => {
      const { id, ...updateData } = input;

      const { data, error } = await supabase
        .from('galeria_tags')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galeria-tags'] });
    }
  });

  const deleteTagMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('galeria_tags')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galeria-tags'] });
      queryClient.invalidateQueries({ queryKey: ['galeria-fotos'] });
    }
  });

  return {
    tags: tagsQuery.data || [],
    isLoading: tagsQuery.isLoading,
    error: tagsQuery.error,
    createTag: createTagMutation.mutateAsync,
    updateTag: updateTagMutation.mutateAsync,
    deleteTag: deleteTagMutation.mutateAsync,
    isCreating: createTagMutation.isPending,
    isUpdating: updateTagMutation.isPending,
    isDeleting: deleteTagMutation.isPending
  };
}

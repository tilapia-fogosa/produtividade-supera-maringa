import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActiveUnit } from '@/contexts/ActiveUnitContext';

export interface GaleriaFoto {
  id: string;
  nome: string;
  url: string;
  thumbnail_url: string | null;
  turma_id: string | null;
  aluno_id: string | null;
  unit_id: string;
  created_at: string;
  created_by: string | null;
  visivel: boolean;
  turma?: {
    id: string;
    nome: string;
  } | null;
  aluno?: {
    id: string;
    nome: string;
  } | null;
  tags?: {
    id: string;
    nome: string;
    cor: string;
  }[];
}

interface CreateFotoInput {
  nome: string;
  url: string;
  thumbnail_url?: string;
  turma_id?: string | null;
  aluno_id?: string | null;
  tag_ids?: string[];
}

interface UpdateFotoInput {
  id: string;
  nome?: string;
  turma_id?: string | null;
  aluno_id?: string | null;
  tag_ids?: string[];
  visivel?: boolean;
}

export function useGaleriaFotos() {
  const { activeUnit } = useActiveUnit();
  const queryClient = useQueryClient();

  const fotosQuery = useQuery({
    queryKey: ['galeria-fotos', activeUnit],
    queryFn: async () => {
      if (!activeUnit) return [];
      
      const { data: fotos, error } = await supabase
        .from('galeria_fotos')
        .select(`
          *,
          turma:turmas(id, nome),
          aluno:alunos(id, nome)
        `)
        .eq('unit_id', activeUnit.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar tags para cada foto
      const fotoIds = fotos?.map(f => f.id) || [];
      
      if (fotoIds.length === 0) return [];

      const { data: fotosTags, error: tagsError } = await supabase
        .from('galeria_fotos_tags')
        .select(`
          foto_id,
          tag:galeria_tags(id, nome, cor)
        `)
        .in('foto_id', fotoIds);

      if (tagsError) throw tagsError;

      // Mapear tags para cada foto
      const fotosComTags = fotos?.map(foto => ({
        ...foto,
        tags: fotosTags
          ?.filter(ft => ft.foto_id === foto.id)
          .map(ft => ft.tag)
          .filter(Boolean) || []
      })) as GaleriaFoto[];

      return fotosComTags;
    },
    enabled: !!activeUnit
  });

  const createFotoMutation = useMutation({
    mutationFn: async (input: CreateFotoInput) => {
      if (!activeUnit?.id) throw new Error('Unidade não selecionada');

      const { data: { user } } = await supabase.auth.getUser();

      const { data: foto, error } = await supabase
        .from('galeria_fotos')
        .insert({
          nome: input.nome,
          url: input.url,
          thumbnail_url: input.thumbnail_url,
          turma_id: input.turma_id || null,
          aluno_id: input.aluno_id || null,
          unit_id: activeUnit.id,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Adicionar tags
      if (input.tag_ids && input.tag_ids.length > 0) {
        const { error: tagsError } = await supabase
          .from('galeria_fotos_tags')
          .insert(input.tag_ids.map(tag_id => ({
            foto_id: foto.id,
            tag_id
          })));

        if (tagsError) throw tagsError;
      }

      return foto;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galeria-fotos'] });
    }
  });

  const updateFotoMutation = useMutation({
    mutationFn: async (input: UpdateFotoInput) => {
      const { id, tag_ids, ...updateData } = input;

      // Atualizar foto
      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('galeria_fotos')
          .update(updateData)
          .eq('id', id);

        if (error) throw error;
      }

      // Atualizar tags
      if (tag_ids !== undefined) {
        // Remover tags antigas
        await supabase
          .from('galeria_fotos_tags')
          .delete()
          .eq('foto_id', id);

        // Adicionar novas tags
        if (tag_ids.length > 0) {
          const { error: tagsError } = await supabase
            .from('galeria_fotos_tags')
            .insert(tag_ids.map(tag_id => ({
              foto_id: id,
              tag_id
            })));

          if (tagsError) throw tagsError;
        }
      }

      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galeria-fotos'] });
    }
  });

  const deleteFotoMutation = useMutation({
    mutationFn: async (id: string) => {
      // Buscar URL da foto para deletar do storage
      const { data: foto } = await supabase
        .from('galeria_fotos')
        .select('url')
        .eq('id', id)
        .single();

      // Deletar foto do banco
      const { error } = await supabase
        .from('galeria_fotos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Tentar deletar do storage
      if (foto?.url) {
        const path = foto.url.split('/galeria-fotos/').pop();
        if (path) {
          await supabase.storage.from('galeria-fotos').remove([path]);
        }
      }

      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galeria-fotos'] });
    }
  });

  return {
    fotos: fotosQuery.data || [],
    isLoading: fotosQuery.isLoading,
    error: fotosQuery.error,
    createFoto: createFotoMutation.mutateAsync,
    updateFoto: updateFotoMutation.mutateAsync,
    deleteFoto: deleteFotoMutation.mutateAsync,
    isCreating: createFotoMutation.isPending,
    isUpdating: updateFotoMutation.isPending,
    isDeleting: deleteFotoMutation.isPending
  };
}

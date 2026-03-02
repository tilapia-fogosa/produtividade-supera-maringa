/**
 * Hook para gerenciar mensagens automáticas do WhatsApp
 * 
 * Log: Hook customizado para operações CRUD de mensagens automáticas
 * Etapas:
 * 1. Buscar mensagens do usuário logado (profile_id)
 * 2. Criar nova mensagem
 * 3. Atualizar mensagem existente
 * 4. Excluir mensagem
 * 5. Estados de loading e erro
 * 
 * Utiliza Supabase com RLS habilitado para segurança
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import type { AutoMessage } from "../types/whatsapp.types";

interface CreateAutoMessageParams {
  nome: string;
  mensagem: string;
}

interface UpdateAutoMessageParams {
  id: string;
  nome?: string;
  mensagem?: string;
  ativo?: boolean;
}

// Buscar mensagens automáticas do usuário
export function useAutoMessages() {
  return useQuery({
    queryKey: ['whatsapp-auto-messages'],
    queryFn: async (): Promise<AutoMessage[]> => {
      console.log('useAutoMessages: Buscando mensagens automáticas');
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.log('useAutoMessages: Nenhum usuário autenticado');
        return [];
      }

      const { data, error } = await supabase
        .from('whatsapp_auto_messages')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('useAutoMessages: Erro ao buscar mensagens:', error);
        throw error;
      }

      return (data || []).map(msg => ({
        id: msg.id,
        nome: msg.nome,
        mensagem: msg.mensagem,
        ativo: msg.ativo,
        profileId: msg.profile_id,
        createdAt: msg.created_at,
        updatedAt: msg.updated_at || msg.created_at,
      })) as AutoMessage[];
    },
  });
}

// Criar nova mensagem automática
export function useCreateAutoMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ nome, mensagem }: CreateAutoMessageParams) => {
      console.log('useCreateAutoMessage: Criando mensagem:', { nome, mensagem });

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('whatsapp_auto_messages')
        .insert({
          profile_id: user.id,
          nome,
          mensagem,
          ativo: true,
        })
        .select()
        .single();

      if (error) {
        console.error('useCreateAutoMessage: Erro ao criar mensagem:', error);
        throw error;
      }

      console.log('useCreateAutoMessage: Mensagem criada com sucesso:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-auto-messages'] });
      console.log('useCreateAutoMessage: Criação concluída');
    },
    onError: (error) => {
      console.error('useCreateAutoMessage: Erro na criação:', error);
      console.error('useCreateAutoMessage: Erro na criação:', error);
    },
  });
}

// Atualizar mensagem automática
export function useUpdateAutoMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateAutoMessageParams) => {
      console.log('useUpdateAutoMessage: Atualizando mensagem:', { id, updates });

      const { data, error } = await supabase
        .from('whatsapp_auto_messages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('useUpdateAutoMessage: Erro ao atualizar:', error);
        throw error;
      }

      console.log('useUpdateAutoMessage: Mensagem atualizada:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-auto-messages'] });
      console.log('useUpdateAutoMessage: Atualização concluída');
    },
    onError: (error) => {
      console.error('useUpdateAutoMessage: Erro na atualização:', error);
      console.error('useUpdateAutoMessage: Erro na atualização:', error);
    },
  });
}

// Excluir mensagem automática
export function useDeleteAutoMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log('useDeleteAutoMessage: Excluindo mensagem:', id);

      const { error } = await supabase
        .from('whatsapp_auto_messages')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('useDeleteAutoMessage: Erro ao excluir:', error);
        throw error;
      }

      console.log('useDeleteAutoMessage: Mensagem excluída com sucesso');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-auto-messages'] });
      console.log('useDeleteAutoMessage: Exclusão concluída');
    },
    onError: (error) => {
      console.error('useDeleteAutoMessage: Erro na exclusão:', error);
      console.error('useDeleteAutoMessage: Erro na exclusão:', error);
    },
  });
}

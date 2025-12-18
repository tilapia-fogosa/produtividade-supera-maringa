/**
 * Hook para marcar mensagens como lidas
 * 
 * Log: Hook personalizado que marca todas as mensagens de um grupo como lidas
 * Etapas:
 * 1. Recebe o grupoWppId como parâmetro
 * 2. Atualiza todas as mensagens não lidas (lida = false) desse grupo
 * 3. Define lida = true e lida_hora = timestamp atual
 * 4. Invalida query de conversas para atualizar a lista
 * 5. Retorna função mutate para ser chamada quando abrir conversa
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  console.log('useMarkAsRead: Hook inicializado');

  return useMutation({
    mutationFn: async (grupoWppId: string) => {
      console.log('useMarkAsRead: Marcando mensagens como lidas para grupo:', grupoWppId);
      
      const { error } = await supabase
        .from('historico_whatsapp_grupos')
        .update({ 
          lida: true, 
          lida_hora: new Date().toISOString() 
        })
        .eq('grupo_wpp_id', grupoWppId)
        .eq('lida', false)
        .eq('from_me', false);
      
      if (error) {
        console.error('useMarkAsRead: Erro ao marcar como lida:', error);
        throw error;
      }
      
      console.log('useMarkAsRead: Mensagens marcadas como lidas com sucesso');
    },
    onMutate: async (grupoWppId: string) => {
      console.log('useMarkAsRead: Iniciando atualização otimista para grupo:', grupoWppId);

      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: ['whatsapp-conversations'] });
      await queryClient.cancelQueries({ queryKey: ['whatsapp-group-conversations'] });

      // Atualizar cache otimisticamente
      queryClient.setQueriesData(
        { queryKey: ['whatsapp-conversations'] },
        (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((conversation: any) => {
            if (conversation.clientId === grupoWppId) {
              return { ...conversation, unreadCount: 0 };
            }
            return conversation;
          });
        }
      );

      queryClient.setQueriesData(
        { queryKey: ['whatsapp-group-conversations'] },
        (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((conversation: any) => {
            if (conversation.clientId === grupoWppId) {
              return { ...conversation, unreadCount: 0 };
            }
            return conversation;
          });
        }
      );
    },
    onSuccess: () => {
      console.log('useMarkAsRead: Mutation bem-sucedida');
    },
    onError: (error) => {
      console.error('useMarkAsRead: Erro na mutation:', error);
      // Invalidar para reverter ao estado do servidor
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-group-conversations'] });
    }
  });
}

/**
 * Hook para marcar mensagens como lidas
 * 
 * Log: Hook personalizado que marca todas as mensagens de uma conversa como lidas
 * Etapas:
 * 1. Recebe o clientId como parâmetro
 * 2. Atualiza todas as mensagens não lidas (lida = false) dessa conversa
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
    mutationFn: async (clientId: string) => {
      console.log('useMarkAsRead: Marcando mensagens como lidas para o cliente:', clientId);

      const { error } = await supabase
        .from('historico_comercial')
        .update({
          lida: true,
          lida_em: new Date().toISOString()
        })
        .eq('telefone', clientId)
        .eq('lida', false)
        .eq('from_me', false);

      if (error) {
        console.error('useMarkAsRead: Erro ao marcar como lida:', error);
        throw error;
      }

      console.log('useMarkAsRead: Mensagens marcadas como lidas com sucesso');
    },
    onMutate: async (clientId: string) => {
      console.log('useMarkAsRead: Iniciando atualização otimista para cliente:', clientId);

      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: ['whatsapp-conversations'] });

      // Atualizar cache otimisticamente
      queryClient.setQueriesData(
        { queryKey: ['whatsapp-conversations'] },
        (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((conversation: any) => {
            if (conversation.clientId === clientId) {
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
    }
  });
}

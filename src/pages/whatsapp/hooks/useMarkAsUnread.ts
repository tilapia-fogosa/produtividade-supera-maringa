/**
 * Hook para marcar mensagens como não lidas
 * 
 * Log: Hook que marca a última mensagem de um grupo como não lida
 * para que o grupo volte a aparecer com indicador de não lido
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMarkAsUnread() {
  const queryClient = useQueryClient();

  console.log('useMarkAsUnread: Hook inicializado');

  return useMutation({
    mutationFn: async (grupoWppId: string) => {
      console.log('useMarkAsUnread: Marcando última mensagem como não lida para grupo:', grupoWppId);
      
      // Buscar a última mensagem do grupo que não seja from_me
      const { data: lastMessage, error: fetchError } = await supabase
        .from('historico_whatsapp_grupos')
        .select('id')
        .eq('grupo_wpp_id', grupoWppId)
        .eq('from_me', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (fetchError) {
        console.error('useMarkAsUnread: Erro ao buscar última mensagem:', fetchError);
        throw fetchError;
      }
      
      if (!lastMessage) {
        console.log('useMarkAsUnread: Nenhuma mensagem encontrada para marcar como não lida');
        return;
      }
      
      // Marcar como não lida
      const { error } = await supabase
        .from('historico_whatsapp_grupos')
        .update({ 
          lida: false, 
          lida_hora: null 
        })
        .eq('id', lastMessage.id);
      
      if (error) {
        console.error('useMarkAsUnread: Erro ao marcar como não lida:', error);
        throw error;
      }
      
      console.log('useMarkAsUnread: Mensagem marcada como não lida com sucesso');
    },
    onMutate: async (grupoWppId: string) => {
      console.log('useMarkAsUnread: Iniciando atualização otimista para grupo:', grupoWppId);

      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: ['whatsapp-conversations'] });
      await queryClient.cancelQueries({ queryKey: ['whatsapp-group-conversations'] });

      // Atualizar cache otimisticamente (colocar 1 como não lido)
      queryClient.setQueriesData(
        { queryKey: ['whatsapp-conversations'] },
        (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((conversation: any) => {
            if (conversation.clientId === grupoWppId) {
              return { ...conversation, unreadCount: 1 };
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
              return { ...conversation, unreadCount: 1 };
            }
            return conversation;
          });
        }
      );
    },
    onSuccess: () => {
      console.log('useMarkAsUnread: Mutation bem-sucedida');
      // Invalidar para buscar contagem real
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-group-conversations'] });
    },
    onError: (error) => {
      console.error('useMarkAsUnread: Erro na mutation:', error);
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-group-conversations'] });
    }
  });
}

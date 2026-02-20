/**
 * Hook de realtime para mensagens WhatsApp
 * Escuta INSERTs nas tabelas historico_whatsapp_grupos e historico_whatsapp_pedagogico
 */
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMessagesRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('🔔 [useMessagesRealtime] Iniciando listeners de realtime...');

    // Canal para historico_whatsapp_grupos
    const gruposChannel = supabase
      .channel('whatsapp-grupos-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'historico_whatsapp_grupos'
        },
        (payload) => {
          console.log('🔔 [useMessagesRealtime] Nova mensagem em grupo:', payload);
          
          // Invalidar cache de mensagens do grupo específico
          const grupoId = payload.new?.grupo_id;
          if (grupoId) {
            queryClient.invalidateQueries({ 
              queryKey: ['whatsapp-group-messages', grupoId] 
            });
          }
          
          // Invalidar cache de conversas de grupos (para atualizar última mensagem)
          queryClient.invalidateQueries({ 
            queryKey: ['whatsapp-group-conversations'] 
          });
          
          // Invalidar cache geral de conversas
          queryClient.invalidateQueries({ 
            queryKey: ['whatsapp-conversations'] 
          });
        }
      )
      .subscribe((status) => {
        console.log('🔔 [useMessagesRealtime] Status canal grupos:', status);
      });

    // Canal para historico_whatsapp_pedagogico
    const pedagogicoChannel = supabase
      .channel('whatsapp-pedagogico-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'historico_whatsapp_pedagogico'
        },
        (payload) => {
          console.log('🔔 [useMessagesRealtime] Nova mensagem pedagógica:', payload);
          
          // Invalidar caches relevantes
          queryClient.invalidateQueries({ 
            queryKey: ['whatsapp-individual-messages'] 
          });
          
          queryClient.invalidateQueries({ 
            queryKey: ['whatsapp-conversations'] 
          });
        }
      )
      .subscribe((status) => {
        console.log('🔔 [useMessagesRealtime] Status canal pedagógico:', status);
      });

    // Cleanup: remover canais ao desmontar
    return () => {
      console.log('🔔 [useMessagesRealtime] Removendo listeners de realtime...');
      supabase.removeChannel(gruposChannel);
      supabase.removeChannel(pedagogicoChannel);
    };
  }, [queryClient]);
}

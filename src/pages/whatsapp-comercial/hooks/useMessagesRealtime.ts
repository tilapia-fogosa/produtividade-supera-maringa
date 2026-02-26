/**
 * Hook de realtime para mensagens WhatsApp
 * Escuta INSERTs nas tabelas historico_comercial
 */
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMessagesRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('🔔 [useMessagesRealtime] Iniciando listeners de realtime...');

    const comercialChannel = supabase
      .channel('whatsapp-comercial-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'historico_comercial'
        },
        (payload) => {
          console.log('🔔 [useMessagesRealtime] Nova mensagem comercial:', payload);

          const clientId = payload.new?.telefone;
          if (clientId) {
            queryClient.invalidateQueries({
              queryKey: ['whatsapp-individual-messages', clientId]
            });
          }

          queryClient.invalidateQueries({
            queryKey: ['whatsapp-conversations']
          });
        }
      )
      .subscribe((status) => {
        console.log('🔔 [useMessagesRealtime] Status canal comercial:', status);
      });

    return () => {
      console.log('🔔 [useMessagesRealtime] Removendo listeners de realtime...');
      supabase.removeChannel(comercialChannel);
    };
  }, [queryClient]);
}

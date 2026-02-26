/**
 * Hook para buscar mensagens de uma conversa Comercial
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Message } from "../types/whatsapp.types";

// Corrige URLs de mídia para o formato público do Supabase Storage
const fixMediaUrl = (url: string | null): string | null => {
  if (!url) return null;
  // Se a URL contém /storage/v1/object/ mas não tem /public/, adiciona
  if (url.includes('/storage/v1/object/') && !url.includes('/storage/v1/object/public/')) {
    return url.replace('/storage/v1/object/', '/storage/v1/object/public/');
  }
  return url;
};

export function useMessages(clientId: string | null) {
  return useQuery({
    queryKey: ['whatsapp-individual-messages', clientId],
    queryFn: async (): Promise<Message[]> => {
      if (!clientId) return [];

      console.log('useMessages: Buscando mensagens comerciais para o telefone:', clientId);

      const { data, error } = await supabase
        .rpc('get_commercial_messages_by_phone' as any, {
          p_telefone: clientId
        });

      if (error) {
        console.error('useMessages: Erro ao buscar mensagens:', error);
        throw error;
      }

      return ((data as any[]) || []).map(msg => ({
        id: msg.id,
        clientId: msg.telefone,
        content: msg.mensagem || '',
        createdAt: msg.created_at,
        fromMe: msg.from_me || false,
        createdByName: msg.from_me ? (msg.created_by_name || "Eu") : null,
        tipoMensagem: msg.tipo_mensagem || 'text',
        urlMedia: fixMediaUrl(msg.url_media) || null
      }));
    },
    enabled: !!clientId
  });
}

/**
 * Hook para buscar mensagens de uma conversa Comercial
 * Agora também carrega reações da tabela whatsapp_message_reactions
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Message, MessageReaction } from "../types/whatsapp.types";

const fixMediaUrl = (url: string | null): string | null => {
  if (!url) return null;
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

      console.log('useMessages: Buscando mensagens comerciais para:', clientId);

      const { data, error } = await supabase
        .rpc('get_commercial_messages_by_phone' as any, {
          p_telefone: clientId
        });

      if (error) {
        console.error('useMessages: Erro ao buscar mensagens:', error);
        throw error;
      }

      const messages: Message[] = ((data as any[]) || []).map(msg => ({
        id: msg.id,
        clientId: msg.telefone,
        content: msg.mensagem || '',
        createdAt: msg.created_at,
        fromMe: msg.from_me || false,
        createdByName: msg.from_me ? (msg.created_by_name || "Eu") : null,
        tipoMensagem: msg.tipo_mensagem || 'text',
        urlMedia: fixMediaUrl(msg.url_media) || null
      }));

      // Buscar reações para todas as mensagens
      if (messages.length > 0) {
        const messageIds = messages.map(m => Number(m.id)).filter(id => !isNaN(id));
        
        if (messageIds.length > 0) {
          const { data: reactions, error: reactionsError } = await supabase
            .from('whatsapp_message_reactions')
            .select('*')
            .in('historico_comercial_id', messageIds)
            .eq('tipo', 'reacao');

          if (!reactionsError && reactions) {
            const reactionsMap = new Map<number, MessageReaction[]>();
            for (const r of reactions as any[]) {
              const msgId = r.historico_comercial_id;
              if (!reactionsMap.has(msgId)) {
                reactionsMap.set(msgId, []);
              }
              reactionsMap.get(msgId)!.push({
                emoji: r.emoji,
                senderId: r.profile_id || '',
                senderName: r.profile_name || undefined,
              });
            }

            for (const msg of messages) {
              const msgReactions = reactionsMap.get(Number(msg.id));
              if (msgReactions) {
                msg.reactions = msgReactions;
              }
            }
          }
        }
      }

      return messages;
    },
    enabled: !!clientId
  });
}

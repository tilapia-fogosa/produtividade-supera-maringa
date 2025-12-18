/**
 * Hook para buscar mensagens de grupo do WhatsApp usando RPC
 * Cruza dados com tabela de alunos para obter nome real do remetente
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Message } from "../types/whatsapp.types";

interface GroupMessageData {
  id: string;
  grupo_id: string;
  mensagem: string;
  enviado_por: string;
  nome_remetente: string | null;
  nome_remetente_resolvido: string;
  from_me: boolean;
  tipo_mensagem: string | null;
  url_media: string | null;
  created_at: string;
  grupo_nome: string | null;
  reaction: string | null;
}

// Corrige URLs de mídia para o formato público do Supabase Storage
const fixMediaUrl = (url: string | null): string | null => {
  if (!url) return null;
  
  // Se a URL contém /storage/v1/object/ mas não tem /public/, adiciona
  if (url.includes('/storage/v1/object/') && !url.includes('/storage/v1/object/public/')) {
    return url.replace('/storage/v1/object/', '/storage/v1/object/public/');
  }
  
  return url;
};

export function useGroupMessages(grupoWppId: string | null) {
  return useQuery({
    queryKey: ['whatsapp-group-messages', grupoWppId],
    queryFn: async (): Promise<Message[]> => {
      if (!grupoWppId) {
        console.log('useGroupMessages: grupoWppId é null, retornando array vazio');
        return [];
      }

      console.log('useGroupMessages: Buscando mensagens do grupo:', grupoWppId);

      const { data, error } = await supabase.rpc('get_group_messages_with_names', {
        p_grupo_wpp_id: grupoWppId
      });

      if (error) {
        console.error('useGroupMessages: Erro ao buscar mensagens:', error.message, error.details, error.hint);
        throw new Error(`Erro ao buscar mensagens: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.log('useGroupMessages: Nenhuma mensagem encontrada para grupo:', grupoWppId);
        return [];
      }

      const allMessages = data as GroupMessageData[];
      
      // Separar mensagens normais e reações
      const normalMessages = allMessages.filter(m => m.tipo_mensagem !== 'reactionMessage');
      const reactionMessages = allMessages.filter(m => m.tipo_mensagem === 'reactionMessage');

      console.log('useGroupMessages: Reações encontradas:', reactionMessages.length);

      // Criar mapa de reações por ID da mensagem reagida
      const reactionsMap = new Map<string, { emoji: string; senderId: string; senderName?: string }[]>();
      reactionMessages.forEach(reaction => {
        const targetId = reaction.reaction;
        if (!targetId) return;
        
        if (!reactionsMap.has(targetId)) {
          reactionsMap.set(targetId, []);
        }
        reactionsMap.get(targetId)!.push({
          emoji: reaction.mensagem || '',
          senderId: reaction.enviado_por || '',
          senderName: reaction.nome_remetente_resolvido || undefined
        });
      });

      // Converter para o formato Message e associar reações
      const messages: Message[] = normalMessages.map((msg) => ({
        id: msg.id,
        clientId: msg.grupo_id,
        content: msg.mensagem || '',
        createdAt: msg.created_at,
        fromMe: msg.from_me || false,
        createdByName: msg.from_me ? null : msg.nome_remetente_resolvido,
        tipoMensagem: msg.tipo_mensagem,
        urlMedia: fixMediaUrl(msg.url_media),
        reactions: reactionsMap.get(msg.id) || [],
      }));

      console.log('useGroupMessages: Mensagens carregadas:', messages.length);
      return messages;
    },
    enabled: !!grupoWppId,
    staleTime: 10000, // 10 segundos
  });
}

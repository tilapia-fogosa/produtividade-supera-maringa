/**
 * Hook para buscar mensagens de grupo do WhatsApp usando RPC
 * Cruza dados com tabela de alunos para obter nome real do remetente
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Message } from "../types/whatsapp.types";

interface GroupMessageData {
  id: number;
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
}

export function useGroupMessages(grupoWppId: string | null) {
  return useQuery({
    queryKey: ['whatsapp-group-messages', grupoWppId],
    queryFn: async (): Promise<Message[]> => {
      if (!grupoWppId) {
        return [];
      }

      console.log('useGroupMessages: Buscando mensagens do grupo:', grupoWppId);

      const { data, error } = await supabase.rpc('get_group_messages_with_names', {
        p_grupo_wpp_id: grupoWppId
      });

      if (error) {
        console.error('useGroupMessages: Erro ao buscar mensagens:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('useGroupMessages: Nenhuma mensagem encontrada');
        return [];
      }

      // Converter para o formato Message
      const messages: Message[] = (data as GroupMessageData[]).map((msg) => ({
        id: msg.id,
        clientId: msg.grupo_id,
        content: msg.mensagem || '',
        createdAt: msg.created_at,
        fromMe: msg.from_me || false,
        createdByName: msg.from_me ? null : msg.nome_remetente_resolvido,
        tipoMensagem: msg.tipo_mensagem,
        urlMedia: msg.url_media,
      }));

      console.log('useGroupMessages: Mensagens carregadas:', messages.length);
      return messages;
    },
    enabled: !!grupoWppId,
    staleTime: 10000, // 10 segundos
  });
}

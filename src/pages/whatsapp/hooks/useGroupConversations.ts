/**
 * Hook para buscar grupos do WhatsApp usando RPC
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Conversation } from "../types/whatsapp.types";

interface GroupData {
  id: number;
  grupo_nome: string;
  grupo_wpp_id: string;
  turma_id: string | null;
  ultima_mensagem: string | null;
  ultima_mensagem_at: string | null;
  total_mensagens: number;
}

export function useGroupConversations() {
  return useQuery({
    queryKey: ['whatsapp-group-conversations'],
    queryFn: async (): Promise<Conversation[]> => {
      console.log('useGroupConversations: Buscando grupos via RPC');

      const { data, error } = await supabase.rpc('get_groups_with_last_message');

      if (error) {
        console.error('useGroupConversations: Erro ao buscar grupos:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('useGroupConversations: Nenhum grupo encontrado');
        return [];
      }

      // Converter para o formato Conversation
      const conversations: Conversation[] = (data as GroupData[]).map((group) => ({
        clientId: group.grupo_wpp_id, // Usar grupo_wpp_id como identificador
        clientName: group.grupo_nome || 'Grupo sem nome',
        phoneNumber: group.grupo_wpp_id,
        primeiroNome: group.grupo_nome?.split(' ')[0] || 'Grupo',
        status: 'grupo',
        lastMessage: group.ultima_mensagem || 'Nenhuma mensagem',
        lastMessageTime: group.ultima_mensagem_at || new Date().toISOString(),
        lastMessageFromMe: false,
        totalMessages: group.total_mensagens || 0,
        unitId: '', // Grupos não têm unit_id direto
        tipoAtendimento: 'humano',
        unreadCount: 0,
        isNewLead: false,
        isUnregistered: false,
        isGroup: true,
        leadSource: 'WhatsApp Grupo',
        unitName: 'Maringá',
      }));

      console.log('useGroupConversations: Grupos carregados:', conversations.length);
      return conversations;
    },
    staleTime: 30000, // 30 segundos
  });
}

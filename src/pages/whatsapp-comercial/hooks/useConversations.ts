/**
 * Hook para buscar conversas do WhatsApp Comercial
 * Busca clientes e cruza com a tabela historico_comercial
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Conversation } from "../types/whatsapp.types";

export function useConversations(filter?: string) {
  return useQuery({
    queryKey: ['whatsapp-conversations', filter],
    queryFn: async (): Promise<Conversation[]> => {
      console.log('useConversations: Buscando conversas consolidadas via RPC...');

      const { data, error } = await supabase
        .rpc('get_commercial_conversations_by_phone' as any);

      if (error) {
        console.error('useConversations: Erro ao buscar conversas via RPC:', error);
        throw error;
      }

      console.log('useConversations: ' + ((data as any[])?.length || 0) + ' conversas retornadas');

      let conversations: Conversation[] = ((data as any[]) || []).map((item: any) => {
        // Se a Query SQL retornou nulo ou o telefone como nome_contato, ele é não-registrado
        const isUnknown = !item.nome_contato || item.nome_contato === item.telefone;

        return {
          clientId: item.telefone,
          clientName: item.nome_contato || item.telefone,
          phoneNumber: item.telefone,
          primeiroNome: item.nome_contato && !isUnknown ? item.nome_contato.split(' ')[0] : 'Desconhecido',
          status: 'novo',
          lastMessage: item.ultima_mensagem || '',
          lastMessageTime: item.ultima_mensagem_at,
          lastMessageFromMe: false,
          totalMessages: item.total_mensagens,
          unitId: '',
          tipoAtendimento: 'humano',
          unreadCount: item.unread_count || 0,
          isNewLead: isUnknown,
          isUnregistered: isUnknown,
          isGroup: false,
          leadSource: item.origem_nome || '',
          unitName: 'Comercial',
          alterarNome: item.alterar_nome || false
        };
      });

      // Apply filter if needed (currently the UI only passes 'unread')
      if (filter === 'unread') {
        conversations = conversations.filter(c => c.unreadCount > 0);
      }

      return conversations;
    },
    staleTime: 5000,
    refetchInterval: 10000 // Polling opcional para checar ativamente
  });
}

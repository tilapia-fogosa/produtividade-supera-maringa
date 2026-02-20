/**
 * Hook para buscar conversas do WhatsApp
 * Agora busca grupos reais da tabela grupos_sup_mga via RPC
 */

import { useQuery } from "@tanstack/react-query";
import { Conversation } from "../types/whatsapp.types";
import { MOCK_CONVERSATIONS } from "../mocks/data";
import { useGroupConversations } from "./useGroupConversations";

export function useConversations(filter?: string) {
  const { data: groupConversations, isLoading: isLoadingGroups } = useGroupConversations();

  return useQuery({
    queryKey: ['whatsapp-conversations', filter, groupConversations],
    queryFn: async (): Promise<Conversation[]> => {
      console.log('useConversations: Buscando conversas com filtro:', filter);

      // Se filtro é "Grupos", retorna apenas grupos reais
      if (filter === 'Grupos') {
        console.log('useConversations: Retornando apenas grupos reais');
        return groupConversations || [];
      }

      // Para outros filtros, retorna conversas mockadas (individuais)
      // Filtra apenas conversas que NÃO são grupos
      const individualConversations = MOCK_CONVERSATIONS.filter(c => !c.isGroup);
      
      // Simula delay para conversas mockadas
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return individualConversations;
    },
    enabled: !isLoadingGroups || filter !== 'Grupos',
  });
}

/**
 * Hook para buscar conversas do WhatsApp (MOCK Version)
 */

import { useQuery } from "@tanstack/react-query";
import { Conversation } from "../types/whatsapp.types";
import { MOCK_CONVERSATIONS } from "../mocks/data";

export function useConversations() {
  console.log('useConversations (MOCK): Retornando conversas mockadas');

  return useQuery({
    queryKey: ['whatsapp-conversations'],
    queryFn: async () => {
      // Simula um delay de rede
      await new Promise(resolve => setTimeout(resolve, 500));
      return MOCK_CONVERSATIONS;
    }
  });
}

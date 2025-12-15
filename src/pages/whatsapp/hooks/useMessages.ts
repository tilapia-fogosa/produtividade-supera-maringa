/**
 * Hook para buscar mensagens de uma conversa específica (MOCK Version)
 */
import { useQuery } from "@tanstack/react-query";
import { Message } from "../types/whatsapp.types";
import { MOCK_MESSAGES } from "../mocks/data";

export function useMessages(clientId: string | null) {
  console.log('useMessages (MOCK): Buscando mensagens para:', clientId);

  return useQuery({
    queryKey: ['whatsapp-messages', clientId],
    queryFn: async () => {
      if (!clientId) return [];

      // Simula delay
      await new Promise(resolve => setTimeout(resolve, 300));

      const rawMessages = MOCK_MESSAGES[clientId as keyof typeof MOCK_MESSAGES] || [];

      return rawMessages.map(msg => ({
        id: msg.id,
        clientId: clientId,
        content: msg.mensagem,
        createdAt: msg.created_at,
        fromMe: msg.from_me,
        createdByName: msg.from_me ? "Eu" : null,
        tipoMensagem: "text"
      })) as Message[];
    },
    enabled: !!clientId
  });
}

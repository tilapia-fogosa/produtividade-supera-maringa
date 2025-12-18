/**
 * Hook para buscar mensagens de uma conversa específica
 * Detecta automaticamente se é grupo ou conversa individual
 */
import { useQuery } from "@tanstack/react-query";
import { Message } from "../types/whatsapp.types";
import { MOCK_MESSAGES } from "../mocks/data";
import { useGroupMessages } from "./useGroupMessages";

// Função para detectar se é um ID de grupo do WhatsApp
function isGroupId(clientId: string): boolean {
  return clientId?.includes('@g.us') || false;
}

export function useMessages(clientId: string | null) {
  const isGroup = clientId ? isGroupId(clientId) : false;
  
  // Hook para mensagens de grupo
  const groupMessagesQuery = useGroupMessages(isGroup ? clientId : null);

  // Hook para mensagens individuais (mock)
  const individualMessagesQuery = useQuery({
    queryKey: ['whatsapp-individual-messages', clientId],
    queryFn: async () => {
      if (!clientId || isGroup) return [];

      console.log('useMessages: Buscando mensagens individuais (mock) para:', clientId);
      
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
    enabled: !!clientId && !isGroup
  });

  // Retorna o hook apropriado baseado no tipo
  if (isGroup) {
    console.log('useMessages: Usando mensagens de grupo para:', clientId);
    return groupMessagesQuery;
  }

  console.log('useMessages: Usando mensagens individuais para:', clientId);
  return individualMessagesQuery;
}

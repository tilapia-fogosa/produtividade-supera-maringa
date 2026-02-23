/**
 * Aba de conversas (container principal) Comercial
 * 
 * Log: Componente principal da aba de conversas
 * Etapas:
 * 1. Gerencia estado da conversa selecionada
 * 2. Busca lista de conversas
 * 3. Renderiza layout de 2 colunas (lista + chat)
 * 4. Responsivo: em mobile, mostra apenas lista ou chat
 * 
 * Utiliza cores do sistema: background, card
 */

import { useState, useEffect, useMemo } from "react";
import { ConversationList } from "./ConversationList";
import { ChatArea } from "./ChatArea";
import { useConversations } from "../hooks/useConversations";
import { useMarkAsRead } from "../hooks/useMarkAsRead";
import { useMessagesRealtime } from "../hooks/useMessagesRealtime";
import { useWhatsappConnectionStatus } from "../hooks/useWhatsappConnectionStatus";
import { WhatsappDisconnectedAlert } from "./WhatsappDisconnectedAlert";
import { useQueryClient } from "@tanstack/react-query";


export function ConversationsTab() {
  console.log('ConversationsTab: Renderizando aba de conversas comercial');

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [lastMarkedClientId, setLastMarkedClientId] = useState<string | null>(null);
  const { data: conversations = [] } = useConversations();
  const { data: whatsappStatus } = useWhatsappConnectionStatus();

  const markAsRead = useMarkAsRead();
  const queryClient = useQueryClient();

  useMessagesRealtime();


  useEffect(() => {
    console.log('ConversationsTab: useEffect executado, selectedClientId:', selectedClientId, 'lastMarkedClientId:', lastMarkedClientId);

    const isUnregistered = selectedClientId?.startsWith('phone_');

    if (selectedClientId && selectedClientId !== lastMarkedClientId && !isUnregistered) {
      console.log('ConversationsTab: Marcando como lida (nova conversa comercial):', selectedClientId);
      markAsRead.mutate(selectedClientId);
      setLastMarkedClientId(selectedClientId);
    }
  }, [selectedClientId, lastMarkedClientId]);

  const handleActivityClick = (clientId: string) => {
    console.log('ConversationsTab: Clique em atividade (Mock: Ação desativada)', clientId);
  };

  const handleToggleTipoAtendimento = (clientId: string, currentTipo: 'bot' | 'humano') => {
    console.log('ConversationsTab: Alternando tipo de atendimento', { clientId, currentTipo });
  };


  const handleSelectClient = (clientId: string, isUnregistered: boolean = false, isGroup: boolean = false) => {
    console.log('ConversationsTab: Selecionando cliente:', clientId, 'não cadastrado:', isUnregistered);

    if (isUnregistered) {
      console.log('ConversationsTab: Permitindo visualização de mensagens não cadastradas');
    }

    queryClient.invalidateQueries({
      queryKey: ['whatsapp-individual-messages', clientId]
    });

    setSelectedClientId(clientId);
  };

  return (
    <>
      <div className="w-full h-full relative overflow-hidden border border-border bg-background rounded-md md:rounded-lg">
        {/* Alerta de WhatsApp desconectado - Z-Index alto */}
        <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
          <div className="pointer-events-auto">
            <WhatsappDisconnectedAlert isDisconnected={whatsappStatus?.isDisconnected || false} />
          </div>
        </div>

        {/* Lista de conversas - Fixa na esquerda (400px) */}
        <div className="absolute top-0 left-0 bottom-0 w-[400px] border-r border-border bg-card overflow-hidden z-10">
          <ConversationList
            selectedClientId={selectedClientId}
            onSelectClient={handleSelectClient}
            onActivityClick={handleActivityClick}
            onToggleTipoAtendimento={handleToggleTipoAtendimento}
          />
        </div>

        {/* Área do chat - Ancorada à esquerda (400px) e direita (0) */}
        <div className="absolute top-0 bottom-0 right-0 left-[400px] flex flex-col bg-background overflow-hidden z-0">
          <ChatArea
            selectedClientId={selectedClientId}
            conversations={conversations}
          />
        </div>
      </div>
    </>
  );
}

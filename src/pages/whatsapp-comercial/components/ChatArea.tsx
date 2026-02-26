/**
 * Área do chat (lado direito)
 * 
 * Log: Componente que exibe o chat completo ou placeholder
 * Etapas:
 * 1. Verifica se há conversa selecionada
 * 2. Se não: exibe placeholder "Selecione uma conversa"
 * 3. Se sim: renderiza ChatHeader + ChatMessages + ChatInput
 * 4. Busca dados da conversa no array de conversas
 * 5. Marca mensagens como lidas automaticamente ao abrir conversa de grupo
 * 
 * Utiliza cores do sistema: background, muted-foreground
 */

import { useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { Conversation } from "../types/whatsapp.types";
import { useMarkAsRead } from "../hooks/useMarkAsRead";
import { useMarkAsUnread } from "../hooks/useMarkAsUnread";

interface ChatAreaProps {
  selectedClientId: string | null;
  conversations: Conversation[];
}

export function ChatArea({ selectedClientId, conversations }: ChatAreaProps) {
  console.log('ChatArea: Renderizando área do chat, cliente selecionado:', selectedClientId);

  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAsUnread } = useMarkAsUnread();

  const selectedConversation = conversations.find(
    conv => conv.clientId === selectedClientId
  );

  // Marcar como lida automaticamente ao abrir conversa de grupo
  useEffect(() => {
    if (selectedConversation?.isGroup && selectedConversation.unreadCount > 0) {
      console.log('ChatArea: Marcando conversa como lida automaticamente:', selectedConversation.clientId);
      markAsRead(selectedConversation.clientId);
    }
  }, [selectedClientId, selectedConversation?.isGroup, selectedConversation?.unreadCount, markAsRead]);

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background text-muted-foreground">
        <MessageCircle className="h-24 w-24 mb-4 opacity-20" />
        <h3 className="text-lg font-medium mb-2">Selecione uma conversa</h3>
        <p className="text-sm">
          Escolha uma conversa na lista para visualizar as mensagens
        </p>
      </div>
    );
  }

  const handleMarkAsRead = () => {
    markAsRead(selectedConversation.clientId);
  };

  const handleMarkAsUnread = () => {
    markAsUnread(selectedConversation.clientId);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-background">
      {/* Header Fixo */}
      <div className="flex-shrink-0 z-10">
        <ChatHeader 
          conversation={selectedConversation} 
          onMarkAsRead={handleMarkAsRead}
          onMarkAsUnread={handleMarkAsUnread}
        />
      </div>

      {/* Área de Mensagens com Scroll Independente */}
      <div className="flex-1 relative min-h-0">
        <div className="absolute inset-0 overflow-y-auto">
          <ChatMessages clientId={selectedConversation.clientId} />
        </div>
      </div>

      {/* Input Fixo no Rodapé */}
      <div className="flex-shrink-0 z-10 bg-background">
        <ChatInput conversation={selectedConversation} />
      </div>
    </div>
  );
}

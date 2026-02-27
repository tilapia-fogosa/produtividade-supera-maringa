/**
 * Área do chat (lado direito) - WhatsApp Comercial
 * Agora com suporte a responder mensagens
 */

import { useEffect, useState, useCallback } from "react";
import { MessageCircle } from "lucide-react";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { ReplyPreviewBar } from "./ReplyPreviewBar";
import { Conversation, Message } from "../types/whatsapp.types";
import { useMarkAsRead } from "../hooks/useMarkAsRead";
import { useMarkAsUnread } from "../hooks/useMarkAsUnread";

interface ChatAreaProps {
  selectedClientId: string | null;
  conversations: Conversation[];
}

export function ChatArea({ selectedClientId, conversations }: ChatAreaProps) {
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAsUnread } = useMarkAsUnread();
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const selectedConversation = conversations.find(
    conv => conv.clientId === selectedClientId
  );

  // Limpar replyingTo ao trocar de conversa
  useEffect(() => {
    setReplyingTo(null);
  }, [selectedClientId]);

  useEffect(() => {
    if (selectedConversation?.isGroup && selectedConversation.unreadCount > 0) {
      markAsRead(selectedConversation.clientId);
    }
  }, [selectedClientId, selectedConversation?.isGroup, selectedConversation?.unreadCount, markAsRead]);

  const handleReply = useCallback((message: Message) => {
    setReplyingTo(message);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background text-muted-foreground">
        <MessageCircle className="h-24 w-24 mb-4 opacity-20" />
        <h3 className="text-lg font-medium mb-2">Selecione uma conversa</h3>
        <p className="text-sm">Escolha uma conversa na lista para visualizar as mensagens</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-background">
      <div className="flex-shrink-0 z-10">
        <ChatHeader 
          conversation={selectedConversation} 
          onMarkAsRead={() => markAsRead(selectedConversation.clientId)}
          onMarkAsUnread={() => markAsUnread(selectedConversation.clientId)}
        />
      </div>

      <div className="flex-1 relative min-h-0">
        <div className="absolute inset-0 overflow-y-auto">
          <ChatMessages clientId={selectedConversation.clientId} onReply={handleReply} />
        </div>
      </div>

      <div className="flex-shrink-0 z-10 bg-background">
        {replyingTo && (
          <ReplyPreviewBar message={replyingTo} onCancel={handleCancelReply} />
        )}
        <ChatInput 
          conversation={selectedConversation} 
          replyingTo={replyingTo}
          onReplySent={handleCancelReply}
        />
      </div>
    </div>
  );
}

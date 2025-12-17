/**
 * Header do chat com informações do contato
 * 
 * Log: Componente que exibe o header do chat
 * Etapas de renderização:
 * 1. Exibe avatar com iniciais do cliente
 * 2. Mostra nome e telefone do cliente
 * 3. Exibe badge com status do cliente
 * 4. Botão para marcar como lida/não lida
 * 5. Aplica cores do sistema para consistência visual
 * 
 * Utiliza cores do sistema: primary, primary-foreground, secondary
 */

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, MailOpen } from "lucide-react";
import { Conversation } from "../types/whatsapp.types";

interface ChatHeaderProps {
  conversation: Conversation;
  onMarkAsRead?: () => void;
  onMarkAsUnread?: () => void;
}

export function ChatHeader({ conversation, onMarkAsRead, onMarkAsUnread }: ChatHeaderProps) {
  console.log('ChatHeader: Renderizando header para:', conversation.clientName);

  const initials = conversation.primeiroNome
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const hasUnread = conversation.unreadCount > 0;

  return (
    <div className="bg-primary text-primary-foreground p-4 border-b border-border flex items-center gap-3">
      {/* Avatar */}
      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-primary-foreground text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate">
          {conversation.clientName}
        </h3>
        {!conversation.isGroup && (
          <p className="text-xs opacity-90">
            {conversation.phoneNumber}
          </p>
        )}
      </div>

      {/* Botão Marcar como Lida/Não Lida */}
      {conversation.isGroup && (
        <Button
          variant="ghost"
          size="sm"
          className="text-primary-foreground hover:bg-primary-foreground/20"
          onClick={hasUnread ? onMarkAsRead : onMarkAsUnread}
          title={hasUnread ? 'Marcar como lida' : 'Marcar como não lida'}
        >
          {hasUnread ? (
            <MailOpen className="h-5 w-5" />
          ) : (
            <Mail className="h-5 w-5" />
          )}
        </Button>
      )}

      {/* Status Badge */}
      <Badge
        variant="outline"
        className="flex-shrink-0 bg-secondary text-white border-secondary hover:bg-secondary/90"
      >
        {conversation.status}
      </Badge>
    </div>
  );
}

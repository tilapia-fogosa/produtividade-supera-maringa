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
import { Mail, MailOpen, Menu, Pencil } from "lucide-react";
import { Conversation } from "../types/whatsapp.types";

interface ChatHeaderProps {
  conversation: Conversation;
  onMarkAsRead?: () => void;
  onMarkAsUnread?: () => void;
  onMenuClick?: () => void;
}

export function ChatHeader({ conversation, onMarkAsRead, onMarkAsUnread, onMenuClick }: ChatHeaderProps) {
  console.log('ChatHeader: Renderizando header para:', conversation.clientName);

  const initials = conversation.clientName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const hasUnread = conversation.unreadCount > 0;

  const clientName = conversation.clientName;
  const phoneNumber = conversation.phoneNumber || '';
  const lastMessageTime = conversation.lastMessageTime;

  return (
    <div className="bg-purple-600 text-white p-4 shadow-sm z-10 sticky top-0 flex items-center justify-between border-b border-purple-700">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden w-10 h-10 shrink-0 text-white hover:bg-purple-500/50"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-white/20 bg-purple-500 flex items-center justify-center text-white text-lg font-bold">
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-lg flex items-center gap-2 group cursor-pointer">
            {clientName}
            {conversation.alterarNome && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-purple-500/50 text-white"
                onClick={() => {
                  // TODO: trigger EditClientNameModal
                  console.log('Edit client name clicked');
                  const event = new CustomEvent('open-edit-client-name', { detail: { conversation: conversation } });
                  window.dispatchEvent(event);
                }}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            )}
          </h2>
          <div className="flex items-center gap-2 text-sm text-purple-100">
            {!conversation.isGroup && (
              <p className="text-xs opacity-90">
                {phoneNumber}
              </p>
            )}
            {conversation.status && (
              <Badge
                variant="outline"
                className="flex-shrink-0 bg-secondary text-white border-secondary hover:bg-secondary/90"
              >
                {conversation.status}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Botão Marcar como Lida/Não Lida */}
      {!conversation.isGroup && ( // Changed from conversation.isGroup to !conversation.isGroup based on common UI patterns for individual chats
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-purple-500/50"
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

    </div>
  );
}

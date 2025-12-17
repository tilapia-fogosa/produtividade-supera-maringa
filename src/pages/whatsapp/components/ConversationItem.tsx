/**
 * Item individual de conversa na lista
 * 
 * Log: Componente que renderiza uma conversa na lista lateral
 * Etapas de renderização:
 * 1. Exibe círculo indicando etapa do lead (sigla + cor)
 * 2. Mostra nome do cliente e última mensagem (truncada)
 * 3. Formata horário da última mensagem
 * 4. Aplica highlight quando a conversa está selecionada
 * 
 * Utiliza cores do sistema: background, foreground, muted, primary
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCheck, Phone } from "lucide-react";
import { Conversation } from "../types/whatsapp.types";
import { getStatusConfig } from "../utils/statusConfig";

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  onCadastrarClick?: (phoneNumber: string) => void;
}

export function ConversationItem({ conversation, isSelected, onClick, onCadastrarClick }: ConversationItemProps) {
  // Configuração do status para o indicador visual
  const statusConfig = getStatusConfig(conversation.status);

  // Formatar horário da última mensagem
  const formatTime = (dateString: string) => {
    try {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isToday(date)) {
        return format(date, 'HH:mm', { locale: ptBR });
      }
      if (isYesterday(date)) {
        return 'Ontem';
      }
      return format(date, 'dd/MM', { locale: ptBR });
    } catch (e) {
      return '';
    }
  };

  // Handler para o badge Cadastrar
  const handleCadastrarClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Não seleciona a conversa ao clicar em cadastrar
    console.log('ConversationItem: Clicando em Cadastrar para telefone:', conversation.phoneNumber);
    onCadastrarClick?.(conversation.phoneNumber);
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-2.5 flex items-start gap-3 hover:bg-muted/50 transition-colors border-b border-border relative group min-h-[72px]",
        isSelected ? "bg-primary/5 hover:bg-primary/10" : "bg-card"
      )}
    >
      {/* Indicador de Seleção (Barra lateral) */}
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
      )}

      {/* Indicador de Etapa do Lead (Círculo com Sigla) */}
      <div className="relative flex-shrink-0 pt-0.5">
        <div
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm transition-transform group-hover:scale-105",
            conversation.isUnregistered ? "bg-gray-400" : statusConfig.cor
          )}
          title={conversation.isUnregistered ? 'Não cadastrado' : statusConfig.label}
        >
          {conversation.isUnregistered ? (
            <Phone className="h-4 w-4" />
          ) : (
            statusConfig.sigla
          )}
        </div>

        {/* Badge de contador de mensagens não lidas (Badge flutuante) */}
        {conversation.unreadCount > 0 && (
          <div className="absolute -bottom-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-sm border-2 border-background z-10">
            {conversation.unreadCount}
          </div>
        )}
      </div>

      {/* Conteúdo da Conversa */}
      <div className="flex-1 min-w-0 flex flex-col gap-1 text-left">
        {/* Linha 1: Nome e Hora (Compacto) */}
        <div className="flex items-center justify-between gap-2 w-full">
          <span className={cn(
            "truncate text-sm leading-tight flex-1",
            conversation.unreadCount > 0 ? "font-bold text-foreground" : "font-medium text-foreground/90"
          )} title={conversation.clientName}>
            {conversation.clientName}
          </span>
          <span className={cn(
            "text-[10px] flex-shrink-0 whitespace-nowrap",
            conversation.unreadCount > 0 ? "text-primary font-bold" : "text-muted-foreground"
          )}>
            {formatTime(conversation.lastMessageTime)}
          </span>
        </div>

        {/* Linha 2: Última mensagem (Preview) */}
        <div className="flex items-center gap-1.5 w-full">
          {/* Status da mensagem enviada */}
          {conversation.lastMessageFromMe && (
            <CheckCheck className="h-3.5 w-3.5 flex-shrink-0 text-primary/70" />
          )}

          <span className={cn(
            "truncate text-xs leading-tight flex-1 block h-4",
            conversation.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
          )} title={conversation.lastMessage}>
            {conversation.lastMessage}
          </span>
        </div>

        {/* Badge Cadastrar para não cadastrados */}
        {conversation.isUnregistered && (
          <div className="flex items-center h-5 mt-0.5">
            <Badge
              className="h-5 px-2 bg-purple-600 hover:bg-purple-700 text-[10px] cursor-pointer shadow-sm animate-pulse"
              onClick={handleCadastrarClick}
            >
              Cadastrar
            </Badge>
          </div>
        )}
      </div>
    </button>
  );
}

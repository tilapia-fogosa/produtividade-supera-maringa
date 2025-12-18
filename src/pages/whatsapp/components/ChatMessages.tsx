/**
 * Lista de mensagens do chat
 * 
 * Log: Componente que renderiza todas as mensagens de uma conversa
 * Etapas:
 * 1. Busca mensagens usando useMessages hook
 * 2. Implementa auto-scroll para a última mensagem
 * 3. Agrupa mensagens por data
 * 4. Renderiza separadores de data
 * 5. Exibe ChatMessage para cada mensagem
 * 
 * Utiliza cores do sistema: muted, muted-foreground
 */

import { useEffect, useRef } from "react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChatMessage } from "./ChatMessage";
import { useMessages } from "../hooks/useMessages";

interface ChatMessagesProps {
  clientId: string;
}

export function ChatMessages({ clientId }: ChatMessagesProps) {
  const { data: messages, isLoading, isError, error } = useMessages(clientId);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (bottomRef.current && messages && messages.length > 0) {
      bottomRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <p className="text-muted-foreground">Carregando mensagens...</p>
      </div>
    );
  }

  if (isError) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    const isAuthError = errorMessage.toLowerCase().includes('autenticado') || 
                        errorMessage.toLowerCase().includes('autenticação') ||
                        errorMessage.toLowerCase().includes('login');
    
    console.error('ChatMessages: Erro ao carregar mensagens:', errorMessage);
    
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-muted/30 p-4">
        <p className="text-destructive text-center">
          {isAuthError 
            ? 'Sessão expirada. Por favor, faça login novamente.' 
            : 'Erro ao carregar mensagens. Tente novamente.'}
        </p>
        {isAuthError && (
          <button 
            onClick={() => window.location.href = '/auth/login'}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Fazer Login
          </button>
        )}
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <p className="text-muted-foreground">Nenhuma mensagem ainda</p>
      </div>
    );
  }

  // Agrupar mensagens por data
  const groupedMessages: { date: Date; messages: typeof messages }[] = [];
  messages.forEach((msg) => {
    const msgDate = new Date(msg.createdAt);
    const lastGroup = groupedMessages[groupedMessages.length - 1];

    if (!lastGroup || !isSameDay(lastGroup.date, msgDate)) {
      groupedMessages.push({ date: msgDate, messages: [msg] });
    } else {
      lastGroup.messages.push(msg);
    }
  });

  return (
    <div className="flex-1 bg-muted/30 min-h-full">
      <div className="p-4 space-y-4 pb-4">
        {groupedMessages.map((group, groupIndex) => (
          <div key={groupIndex}>
            {/* Separador de data */}
            <div className="flex justify-center my-6">
              <span className="bg-background border border-border text-muted-foreground text-[10px] font-medium px-3 py-1 rounded-full shadow-sm uppercase tracking-wide">
                {format(group.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>

            {/* Mensagens do dia */}
            {group.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
        ))}

        {/* Elemento âncora para scroll automático */}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}

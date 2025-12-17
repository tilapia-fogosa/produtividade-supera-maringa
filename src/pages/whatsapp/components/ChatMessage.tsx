/**
 * Balão de mensagem individual
 * 
 * Log: Componente que renderiza uma mensagem no chat
 * Etapas de renderização:
 * 1. Determina alinhamento baseado em fromMe (direita/esquerda)
 * 2. Aplica cores diferentes para mensagens enviadas vs recebidas
 * 3. Formata horário da mensagem
 * 4. Exibe conteúdo com quebras de linha preservadas
 * 5. Renderiza mídia (imagem, áudio, vídeo, documento) quando disponível
 * 
 * Utiliza cores do sistema:
 * - Mensagem enviada (fromMe=true): primary/primary-foreground
 * - Mensagem recebida (fromMe=false): card/card-foreground
 */

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Message } from "../types/whatsapp.types";
import { FileText, Play, Maximize2 } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [isOpen, setIsOpen] = useState(false);

  const time = format(new Date(message.createdAt), 'HH:mm', { locale: ptBR });

  // Verifica se tem nome de remetente (mensagens de grupo)
  const senderName = !message.fromMe ? message.createdByName : null;

  // Renderiza mídia baseado no tipo
  const renderMedia = () => {
    if (!message.urlMedia) return null;

    switch (message.tipoMensagem) {
      case 'imageMessage':
      case 'stickerMessage':
        return (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <div className="relative cursor-pointer group w-32 h-32 mb-1">
                <img 
                  src={message.urlMedia} 
                  alt="Imagem" 
                  className="w-full h-full object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <Maximize2 className="h-6 w-6 text-white" />
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] max-h-[90vh] p-2">
              <img 
                src={message.urlMedia} 
                alt="Imagem ampliada" 
                className="max-w-full max-h-[85vh] object-contain mx-auto"
              />
            </DialogContent>
          </Dialog>
        );

      case 'videoMessage':
        return (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <div className="relative cursor-pointer group w-32 h-32 mb-1 bg-muted rounded-lg flex items-center justify-center">
                <video 
                  src={message.urlMedia} 
                  className="w-full h-full object-cover rounded-lg"
                  preload="metadata"
                  muted
                />
                <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                  <Play className="h-8 w-8 text-white fill-white" />
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] max-h-[90vh] p-2">
              <video 
                src={message.urlMedia} 
                controls 
                autoPlay
                className="max-w-full max-h-[85vh] mx-auto"
              />
            </DialogContent>
          </Dialog>
        );

      case 'audioMessage':
      case 'ptt': // Push to talk (áudio de voz)
        return (
          <audio 
            src={message.urlMedia} 
            controls 
            className="w-48 h-10 mb-1"
            preload="metadata"
          />
        );

      case 'documentMessage':
        return (
          <a 
            href={message.urlMedia} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-2 bg-muted rounded-lg mb-1 hover:bg-muted/80 transition-colors"
          >
            <FileText className="h-5 w-5 text-primary" />
            <span className="text-sm">Documento</span>
          </a>
        );

      default:
        // Se tem urlMedia mas tipo desconhecido, mostra como link
        if (message.urlMedia) {
          return (
            <a 
              href={message.urlMedia} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline text-sm"
            >
              Ver anexo
            </a>
          );
        }
        return null;
    }
  };

  return (
    <div
      className={cn(
        "flex mb-2",
        message.fromMe ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[70%] rounded-lg px-3 py-2 shadow-sm",
          message.fromMe
            ? "bg-[#f7dcc9] text-black rounded-br-none"
            : "bg-card text-card-foreground rounded-bl-none border border-border"
        )}
      >
        {/* Nome do remetente em grupos (quando não é fromMe) */}
        {senderName && (
          <p className="text-xs font-semibold text-primary mb-1 truncate">
            {senderName}
          </p>
        )}
        
        {/* Renderiza mídia se houver */}
        {renderMedia()}
        
        {/* Renderiza texto se houver */}
        {message.content && (
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.tipoMensagem === 'audio' && (
              <span className="font-bold">Áudio transcrito: </span>
            )}
            {message.content}
          </p>
        )}
        
        <div className="flex items-center justify-between mt-1 text-xs opacity-70 gap-2">
          {message.fromMe && message.createdByName && (
            <span>{message.createdByName}</span>
          )}
          <span className={!message.fromMe || !message.createdByName ? "ml-auto" : ""}>
            {time}
          </span>
        </div>
      </div>
    </div>
  );
}

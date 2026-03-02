/**
 * Barra de preview da mensagem sendo respondida
 * Exibida acima do input quando o usuário clica em "Responder"
 */

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Message } from "../types/whatsapp.types";

interface ReplyPreviewBarProps {
  message: Message;
  onCancel: () => void;
}

export function ReplyPreviewBar({ message, onCancel }: ReplyPreviewBarProps) {
  const senderName = message.fromMe
    ? (message.createdByName || "Você")
    : (message.createdByName || "Contato");

  const preview = message.content
    ? message.content.substring(0, 100) + (message.content.length > 100 ? "..." : "")
    : "[Mídia]";

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-muted/60 border-t border-border">
      <div className="flex-1 border-l-4 border-primary pl-2 min-w-0">
        <p className="text-xs font-semibold text-primary truncate">{senderName}</p>
        <p className="text-xs text-muted-foreground truncate">{preview}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 flex-shrink-0"
        onClick={onCancel}
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </Button>
    </div>
  );
}

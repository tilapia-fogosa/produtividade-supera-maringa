/**
 * Componente para anexar e enviar mídias (imagem, vídeo, documento)
 * 
 * Fluxo:
 * 1. Usuário clica no ícone de clip
 * 2. Seleciona um arquivo (imagem, vídeo ou documento)
 * 3. Preview é exibido com campo de legenda
 * 4. Ao confirmar, converte para base64 e envia via edge function
 */

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, X, Send, Loader2, FileText, Image, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Conversation } from "../types/whatsapp.types";

interface MediaAttachmentProps {
  conversation: Conversation;
  onMessageSent?: () => void;
}

type MediaType = 'image' | 'video' | 'document';

interface SelectedMedia {
  file: File;
  previewUrl: string;
  type: MediaType;
}

const ACCEPTED_TYPES: Record<MediaType, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  video: ['video/mp4', 'video/quicktime', 'video/webm'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

const ALL_ACCEPTED = [
  ...ACCEPTED_TYPES.image,
  ...ACCEPTED_TYPES.video,
  ...ACCEPTED_TYPES.document,
].join(',');

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

function getMediaType(mimeType: string): MediaType {
  if (ACCEPTED_TYPES.image.includes(mimeType)) return 'image';
  if (ACCEPTED_TYPES.video.includes(mimeType)) return 'video';
  return 'document';
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data URL prefix
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function MediaAttachment({ conversation, onMessageSent }: MediaAttachmentProps) {
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia | null>(null);
  const [caption, setCaption] = useState("");
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('MediaAttachment: Arquivo selecionado:', file.name, file.type, file.size);

    if (file.size > MAX_FILE_SIZE) {
      console.error('MediaAttachment: Arquivo muito grande:', file.size);
      return;
    }

    const type = getMediaType(file.type);
    const previewUrl = URL.createObjectURL(file);

    setSelectedMedia({ file, previewUrl, type });
    setCaption("");

    // Limpa o input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancel = () => {
    if (selectedMedia) {
      URL.revokeObjectURL(selectedMedia.previewUrl);
    }
    setSelectedMedia(null);
    setCaption("");
  };

  const handleSend = async () => {
    if (!selectedMedia) return;

    console.log('MediaAttachment: Enviando mídia:', selectedMedia.type);
    setIsSending(true);

    try {
      const base64 = await fileToBase64(selectedMedia.file);
      const userName = profile?.full_name || user?.email || 'Usuário';
      const profileId = user?.id;

      const isUnregistered = conversation.clientId.startsWith('phone_');
      const isGroup = conversation.clientId.includes('@g.us');

      const body: Record<string, any> = {
        destinatario: isGroup ? conversation.clientId : undefined,
        phone_number: !isGroup ? conversation.phoneNumber : undefined,
        user_name: userName,
        mime_type: selectedMedia.file.type,
        client_id: isGroup ? null : (isUnregistered ? null : conversation.clientId),
        profile_id: profileId,
        unit_id: conversation.unitId,
      };

      // Adiciona campo correto conforme tipo
      if (selectedMedia.type === 'image') {
        body.imagem = base64;
      } else if (selectedMedia.type === 'video') {
        body.video = base64;
      } else {
        // Documentos vão como imagem por enquanto (a edge function suporta)
        body.imagem = base64;
      }

      // Legenda como mensagem
      if (caption.trim()) {
        body.mensagem = caption.trim();
      }

      const { error } = await supabase.functions.invoke('send-whatsapp-message', { body });

      if (error) {
        console.error('MediaAttachment: Erro ao enviar mídia:', error);
        throw error;
      }

      console.log('MediaAttachment: Mídia enviada com sucesso');

      // Limpar
      handleCancel();

      // Invalidar cache
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['whatsapp-individual-messages', conversation.clientId] });
        queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
      }, 1000);

      onMessageSent?.();

    } catch (error) {
      console.error('MediaAttachment: Erro ao enviar mídia:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Preview overlay quando mídia selecionada
  if (selectedMedia) {
    return (
      <div className="absolute inset-0 z-20 bg-background border-t border-border flex flex-col">
        {/* Header do preview */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            {selectedMedia.type === 'image' && <Image className="h-4 w-4 text-primary" />}
            {selectedMedia.type === 'video' && <Video className="h-4 w-4 text-primary" />}
            {selectedMedia.type === 'document' && <FileText className="h-4 w-4 text-primary" />}
            <span className="truncate max-w-[200px]">{selectedMedia.file.name}</span>
            <span className="text-xs text-muted-foreground">
              ({(selectedMedia.file.size / 1024 / 1024).toFixed(1)} MB)
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Área de preview */}
        <div className="flex-1 flex items-center justify-center p-4 bg-muted/30 overflow-hidden">
          {selectedMedia.type === 'image' && (
            <img
              src={selectedMedia.previewUrl}
              alt="Preview"
              className="max-h-full max-w-full object-contain rounded-lg shadow-md"
            />
          )}
          {selectedMedia.type === 'video' && (
            <video
              src={selectedMedia.previewUrl}
              controls
              className="max-h-full max-w-full rounded-lg shadow-md"
            />
          )}
          {selectedMedia.type === 'document' && (
            <div className="flex flex-col items-center gap-3 p-8 bg-card rounded-xl border border-border shadow-sm">
              <FileText className="h-16 w-16 text-primary/60" />
              <span className="text-sm font-medium text-foreground">{selectedMedia.file.name}</span>
              <span className="text-xs text-muted-foreground">
                {(selectedMedia.file.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          )}
        </div>

        {/* Input de legenda + botão enviar */}
        <div className="flex items-center gap-2 p-3 border-t border-border bg-muted/50">
          <Input
            placeholder="Adicionar legenda..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isSending}
            className="flex-1"
            autoFocus
          />
          <Button
            onClick={handleSend}
            disabled={isSending}
            size="icon"
            className="shrink-0"
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Botão de clip (estado normal)
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={ALL_ACCEPTED}
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        className="text-muted-foreground"
        title="Anexar mídia"
      >
        <Paperclip className="h-5 w-5" />
      </Button>
    </>
  );
}

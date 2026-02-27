/**
 * Menu de ações para mensagens (responder / reagir)
 * Exibe popover ao passar o mouse sobre uma mensagem
 */

import { useState } from "react";
import { Reply, SmilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Message } from "../types/whatsapp.types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

interface MessageActionMenuProps {
  message: Message;
  onReply: (message: Message) => void;
  fromMe: boolean;
}

export function MessageActionMenu({ message, onReply, fromMe }: MessageActionMenuProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const handleReact = async (emoji: string) => {
    if (isReacting) return;
    setIsReacting(true);
    setShowEmojiPicker(false);

    try {
      const { error } = await supabase.from('whatsapp_message_reactions').insert({
        historico_comercial_id: Number(message.id),
        tipo: 'reacao',
        emoji,
        profile_id: user?.id || null,
        profile_name: profile?.full_name || user?.email || 'Usuário',
      });

      if (error) {
        console.error('MessageActionMenu: Erro ao reagir:', error);
        return;
      }

      // Invalidar cache para atualizar reações
      queryClient.invalidateQueries({ queryKey: ['whatsapp-individual-messages', message.clientId] });
    } catch (err) {
      console.error('MessageActionMenu: Erro ao reagir:', err);
    } finally {
      setIsReacting(false);
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    handleReact(emojiData.emoji);
  };

  return (
    <div className={`flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${fromMe ? 'order-first' : 'order-last'}`}>
      {/* Botão Responder */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-full hover:bg-muted"
        onClick={() => onReply(message)}
        title="Responder"
      >
        <Reply className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>

      {/* Botão Reagir com popover de emojis */}
      <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full hover:bg-muted"
            title="Reagir"
          >
            <SmilePlus className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align={fromMe ? "end" : "start"}
          className="w-auto p-2"
        >
          <div className="flex items-center gap-1 mb-2">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="text-xl hover:scale-125 transition-transform p-1 rounded hover:bg-muted"
                disabled={isReacting}
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className="border-t border-border pt-2">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme={Theme.LIGHT}
              searchDisabled={false}
              width={280}
              height={300}
              previewConfig={{ showPreview: false }}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

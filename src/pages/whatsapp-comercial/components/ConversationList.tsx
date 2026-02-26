/**
 * Lista de conversas (sidebar esquerdo) Comercial
 * 
 * Log: Componente que renderiza a lista de conversas
 * Etapas:
 * 1. Busca conversas usando useConversations hook
 * 2. Implementa busca/filtro por nome do cliente
 * 3. Renderiza input de busca no topo
 * 4. Exibe lista de ConversationItem em ScrollArea
 * 5. Mostra loading ou mensagem de "sem conversas"
 * 
 * Utiliza cores do sistema: card, border, muted
 */

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus } from "lucide-react";
import { ConversationItem } from "./ConversationItem";
import { useConversations } from "../hooks/useConversations";
import { NewClientDrawer } from "./NewClientDrawer";
import { SendToUnregisteredDrawer } from "./SendToUnregisteredDrawer";
import { useQueryClient } from "@tanstack/react-query";

interface ConversationListProps {
  selectedClientId: string | null;
  onSelectClient: (clientId: string, isUnregistered?: boolean, isGroup?: boolean) => void;
  onActivityClick: (clientId: string) => void;
  onToggleTipoAtendimento: (clientId: string, currentTipo: 'bot' | 'humano') => void;
}

export function ConversationList({ selectedClientId, onSelectClient, onActivityClick, onToggleTipoAtendimento }: ConversationListProps) {
  console.log('ConversationList: Renderizando lista de conversas comercial');

  const [searchQuery, setSearchQuery] = useState("");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPhoneNumber, setDrawerPhoneNumber] = useState("");
  const [sendUnregisteredDrawerOpen, setSendUnregisteredDrawerOpen] = useState(false);

  // Removido filtro de "humano" via hook, buscaremos todas as normais.
  const { data: conversations, isLoading } = useConversations();

  const queryClient = useQueryClient();

  const handleCadastrarClick = (phoneNumber: string) => {
    console.log('ConversationList: Abrindo drawer para cadastrar telefone:', phoneNumber);
    setDrawerPhoneNumber(phoneNumber);
    setDrawerOpen(true);
  };

  const handleCadastroSuccess = () => {
    console.log('ConversationList: Cadastro bem sucedido, invalidando queries');
    queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
  };

  // Filtrar conversas pela busca
  let filteredConversations = conversations?.filter(conv =>
    conv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.phoneNumber.includes(searchQuery)
  );

  // Esconder leads não registrados (dependendo do caso de uso comercial)
  // filteredConversations = filteredConversations?.filter(conv => !conv.isUnregistered);

  if (showUnreadOnly) {
    filteredConversations = filteredConversations?.filter(conv => conv.unreadCount > 0);
  }

  // Contamos as não lidas entre as normais cadastradas.
  const baseNormals = conversations?.filter(conv => !conv.isUnregistered) || [];
  const totalUnread = baseNormals.filter(conv => conv.unreadCount > 0).length;

  console.log('ConversationList: Conversas filtradas:', filteredConversations?.length);

  return (
    <div className="w-full flex flex-col border-r border-border bg-card h-full">
      {/* Header com busca e filtros */}
      <div className="p-3 border-b border-border bg-card space-y-3">
        {/* Campo de busca com botão de nova mensagem */}
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Buscar conversas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button
            variant="default"
            size="icon"
            onClick={() => setSendUnregisteredDrawerOpen(true)}
            title="Enviar mensagem para número não cadastrado"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </Button>
        </div>

        {/* Filtros com switches em uma linha */}
        <div className="flex items-end gap-6 justify-between px-1">
          <div className="flex flex-col items-center gap-1">
            <Label htmlFor="unread-filter" className="text-xs cursor-pointer whitespace-nowrap text-muted-foreground">
              Não lidas {totalUnread > 0 && `(${totalUnread})`}
            </Label>
            <Switch
              id="unread-filter"
              checked={showUnreadOnly}
              onCheckedChange={setShowUnreadOnly}
            />
          </div>
        </div>
      </div>

      {/* Lista de conversas */}
      <ScrollArea className="flex-1">
        {isLoading && (
          <div className="p-4 text-center text-muted-foreground">
            Carregando conversas...
          </div>
        )}

        {!isLoading && filteredConversations && filteredConversations.length === 0 && (
          <div className="p-4 text-center text-muted-foreground">
            {searchQuery ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
          </div>
        )}

        {!isLoading && filteredConversations && filteredConversations.map((conversation) => (
          <ConversationItem
            key={conversation.clientId}
            conversation={conversation}
            isSelected={selectedClientId === conversation.clientId}
            onClick={() => onSelectClient(conversation.clientId, conversation.isUnregistered, conversation.isGroup)}
            onCadastrarClick={handleCadastrarClick}
          />
        ))}
      </ScrollArea>

      {/* Drawer de cadastro de novo cliente */}
      <NewClientDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        phoneNumber={drawerPhoneNumber}
        onSuccess={handleCadastroSuccess}
      />

      {/* Drawer para enviar mensagem para número não cadastrado */}
      <SendToUnregisteredDrawer
        open={sendUnregisteredDrawerOpen}
        onOpenChange={setSendUnregisteredDrawerOpen}
      />
    </div>
  );
}

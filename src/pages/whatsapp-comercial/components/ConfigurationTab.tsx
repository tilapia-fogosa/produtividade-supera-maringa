/**
 * Aba de configuração do WhatsApp
 * 
 * Organizada em 3 abas:
 * 1. Mensagens Padronizadas (nível de conta/usuário)
 * 2. Mensagens Automáticas (nível de unidade)
 * 3. Conectividade (status da conexão)
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MessageSquareText, Bot, Wifi } from "lucide-react";
import { useWhatsAppStatus } from "../hooks/useWhatsAppStatus";
import { AutoMessageModal } from "./AutoMessageModal";
import { AutoMessagesList } from "./AutoMessagesList";
import { MensagemAutomaticaModal } from "./MensagemAutomaticaModal";
import { MensagensAutomaticasList } from "./MensagensAutomaticasList";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

export function ConfigurationTab() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<{ id: string; nome: string; mensagem: string } | null>(null);

  const [autoModalOpen, setAutoModalOpen] = useState(false);
  const [autoEditData, setAutoEditData] = useState<{ id: string; tipo: string; mensagem: string } | null>(null);

  const { activeUnit } = useActiveUnit();
  const selectedUnitId = activeUnit?.id;

  const {
    data: whatsappStatus,
    isLoading
  } = useWhatsAppStatus();

  const handleCreateNew = () => {
    setEditData(null);
    setModalOpen(true);
  };

  const handleEdit = (id: string, nome: string, mensagem: string) => {
    setEditData({ id, nome, mensagem });
    setModalOpen(true);
  };

  const handleEditAuto = (id: string, tipo: string, mensagem: string) => {
    setAutoEditData({ id, tipo, mensagem });
    setAutoModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="padronizadas" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="padronizadas" className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4" />
            <span className="hidden sm:inline">Mensagens Padronizadas</span>
            <span className="sm:hidden">Padronizadas</span>
          </TabsTrigger>
          <TabsTrigger value="automaticas" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">Mensagens Automáticas</span>
            <span className="sm:hidden">Automáticas</span>
          </TabsTrigger>
          <TabsTrigger value="conectividade" className="flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            Conectividade
          </TabsTrigger>
        </TabsList>

        {/* Aba 1: Mensagens Padronizadas (nível de conta/usuário) */}
        <TabsContent value="padronizadas">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Mensagens Padronizadas</CardTitle>
                  <CardDescription>
                    Suas mensagens padronizadas pessoais. Cada usuário pode ter suas próprias mensagens.
                  </CardDescription>
                </div>
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Mensagem
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <AutoMessagesList onEdit={handleEdit} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba 2: Mensagens Automáticas (nível de unidade) */}
        <TabsContent value="automaticas">
          <Card>
            <CardHeader>
              <CardTitle>Mensagens Automáticas</CardTitle>
              <CardDescription>
                Mensagens automáticas de boas-vindas e valorização. Configuração compartilhada por toda a unidade.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MensagensAutomaticasList selectedUnitId={selectedUnitId} onEdit={handleEditAuto} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba 3: Conectividade */}
        <TabsContent value="conectividade">
          <Card>
            <CardHeader>
              <CardTitle>Conectividade</CardTitle>
              <CardDescription>
                Status da conexão com o WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status da Conexão</Label>
                <div className="flex items-center gap-3">
                  <Input
                    value={isLoading ? "Carregando..." : whatsappStatus?.label || "Desconectado"}
                    readOnly
                    className="max-w-xs bg-muted cursor-not-allowed"
                  />
                  <Badge variant={whatsappStatus?.color === 'success' ? 'default' : whatsappStatus?.color === 'warning' ? 'secondary' : 'destructive'}>
                    {isLoading ? "..." : whatsappStatus?.label || "Desconectado"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Status em tempo real da conexão com WhatsApp</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de criação/edição de mensagens padronizadas */}
      <AutoMessageModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editData={editData}
      />

      {/* Modal de edição de mensagens automáticas */}
      <MensagemAutomaticaModal
        open={autoModalOpen}
        onOpenChange={setAutoModalOpen}
        editData={autoEditData}
      />
    </div>
  );
}
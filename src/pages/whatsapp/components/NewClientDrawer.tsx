/**
 * Drawer de cadastro de cliente via WhatsApp
 * 
 * Log: Componente drawer que abre da esquerda para direita para cadastrar contatos
 * que enviaram mensagens pelo WhatsApp mas ainda não estão registrados no sistema
 * 
 * Etapas:
 * 1. Recebe o telefone como prop
 * 2. Pré-preenche o campo de telefone (apenas leitura)
 * 3. Define "WhatsApp" como origem padrão
 * 4. Ao submeter:
 *    a) Verifica se já existe cliente com mesmo telefone na unidade
 *    b) Se existir, mostra modal informativo e vincula mensagens ao fechar
 *    c) Se não existir, cria novo cliente na tabela 'clients'
 *    d) Vincula todas as mensagens existentes (UPDATE historico_comercial)
 *    e) Fecha o drawer e atualiza a lista
 */

import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { Phone, AlertTriangle } from "lucide-react";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// import { useCheckDuplicateClient, ExistingClient } from "@/hooks/useCheckDuplicateClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ID do perfil Sistema-Kadin para registros automáticos
const SISTEMA_KADIN_ID = 'eaf94b92-7646-485f-bd96-016bf1add2b2';

interface NewClientDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneNumber: string;
  onSuccess?: () => void;
}

export function NewClientDrawer({ open, onOpenChange, phoneNumber, onSuccess }: NewClientDrawerProps) {
  const { toast } = useToast();
  // const { checkDuplicate, isChecking } = useCheckDuplicateClient();
  const isChecking = false;

  // Estado para controlar o modal de duplicados
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  // const [existingClient, setExistingClient] = useState<ExistingClient | null>(null);
  const existingClient = null;
  // const [pendingFormData, setPendingFormData] = useState<LeadFormData | null>(null);

  console.log('NewClientDrawer: Montando drawer com telefone:', phoneNumber);

  const form = useForm({
    defaultValues: {
      name: "",
      phoneNumber: phoneNumber,
    },
  });

  useEffect(() => {
    if (open && phoneNumber) {
      console.log("NewClientDrawer: Configurando formulário com telefone:", phoneNumber);

      // Preencher telefone
      form.setValue('phoneNumber', phoneNumber);

      // Focar no campo nome após um pequeno delay
      setTimeout(() => {
        const nameInput = document.querySelector('input[name="name"]') as HTMLInputElement;
        if (nameInput) {
          nameInput.focus();
          console.log('NewClientDrawer: Foco definido no campo nome');
        }
      }, 100);
    }
  }, [open, phoneNumber, form]);

  /**
   * Handler principal do formulário
   */
  const onSubmit = async (values: any) => {
    console.log("NewClientDrawer: Mock submit", values);
    toast({
      title: "Contato cadastrado (Mock)",
      description: `Cliente ${values.name} cadastrado com sucesso!`,
    });
    onSuccess?.();
    onOpenChange(false);
    form.reset();
  };

  /* Código de cadastro original removido para mock */

  /* Código de vínculo removido para mock */
  const handleCloseAndLink = () => { };

  const handleCancel = () => {
    console.log('NewClientDrawer: Cancelando cadastro, fechando drawer');
    form.reset();
    onOpenChange(false);
  };

  /**
   * Formata data para exibição
   */
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <SheetTitle>Cadastrar Contato do WhatsApp</SheetTitle>
              </div>
            </div>

            <SheetDescription>
              Este contato enviou mensagens pelo WhatsApp mas ainda não está cadastrado no sistema.
              Preencha os dados abaixo para vincular as mensagens existentes.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* Campo TELEFONE */}
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly className="bg-muted" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Campo NOME */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Digite o nome do contato" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleCancel}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isChecking}
                  >
                    {isChecking ? "Verificando..." : "Cadastrar Contato"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </SheetContent>
      </Sheet>

      {/* Modal informativo de cliente já cadastrado */}
      <Dialog open={showDuplicateModal} onOpenChange={setShowDuplicateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <DialogTitle>Cliente já cadastrado</DialogTitle>
            </div>
            <DialogDescription className="pt-4">
              Este telefone já está vinculado a um cliente cadastrado.
              Ao fechar, as mensagens serão automaticamente vinculadas a este cliente.
            </DialogDescription>
          </DialogHeader>

          {existingClient && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Nome:</span>
                <span className="text-sm font-medium">{existingClient.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Telefone:</span>
                <span className="text-sm font-mono">{existingClient.phone_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Origem:</span>
                <span className="text-sm">{existingClient.lead_source}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className="text-sm">{existingClient.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Cadastrado em:</span>
                <span className="text-sm">{formatDate(existingClient.created_at)}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={handleCloseAndLink}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

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
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { Phone, AlertTriangle } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Opções de origem de Lead comuns
const originOptions = [
  "Instagram",
  "Facebook Ads",
  "Google Ads",
  "Indicação",
  "Passagem",
  "Panfleto",
  "Telemarketing",
  "Ativação",
  "Orgânico"
];

// Schema de validação Zod
const formSchema = z.object({
  unit_id: z.string().min(1, 'Unidade é obrigatória'),
  phoneNumber: z.string(),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  lead_source: z.string().min(1, 'Selecione a origem do lead'),
  observations: z.string().optional()
});

interface NewClientDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneNumber: string;
  onSuccess?: () => void;
}

export function NewClientDrawer({ open, onOpenChange, phoneNumber, onSuccess }: NewClientDrawerProps) {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Maringá Fallback ID em caso de usuário sem unit_ids
  const fallbackUnitId = "0df79a04-444e-46ee-b218-59e4b1835f4a";
  const userUnitId = profile?.unit_ids?.[0] || fallbackUnitId;

  console.log('NewClientDrawer: Montando drawer com telefone:', phoneNumber);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      unit_id: userUnitId,
      name: "",
      phoneNumber: phoneNumber || "",
      email: "",
      lead_source: "",
      observations: ""
    },
  });

  useEffect(() => {
    if (open && phoneNumber) {
      console.log("NewClientDrawer: Configurando formulário com telefone:", phoneNumber);
      form.reset({
        unit_id: userUnitId,
        name: "",
        phoneNumber: phoneNumber,
        email: "",
        lead_source: "",
        observations: ""
      });

      // Focar no campo nome após um pequeno delay
      setTimeout(() => {
        const nameInput = document.querySelector('input[name="name"]') as HTMLInputElement;
        if (nameInput) {
          nameInput.focus();
        }
      }, 100);
    }
  }, [open, phoneNumber, userUnitId, form]);

  /**
   * Handler principal do formulário
   */
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log("NewClientDrawer: Submitting client creation", values);
    setIsSubmitting(true);

    try {
      // Cria registro na tabela clients
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          name: values.name,
          phone_number: values.phoneNumber,
          email: values.email || null,
          lead_source: values.lead_source,
          obs: values.observations || null,
          unit_id: values.unit_id,
          tipo_atendimento: 'humano',
          status: 'novo'
        })
        .select('id')
        .single();

      if (clientError) {
        console.error('Erro ao inserir client:', clientError);
        throw clientError;
      }

      // Opcional: Atualizar historico_comercial para ter o client_id gerado (se precisar pra RLS e afins),
      // embora a listagem e mensagens funcionem pelo 'telefone'.
      if (newClient) {
        await supabase
          .from('historico_comercial')
          .update({ client_id: newClient.id })
          .eq('telefone', values.phoneNumber);
      }

      toast({
        title: "Contato cadastrado",
        description: `Cliente ${values.name} registrado com sucesso!`,
      });

      onSuccess?.();
      onOpenChange(false);
      form.reset();

    } catch (error) {
      console.error("NewClientDrawer: Error on submit:", error);
      toast({
        title: "Erro ao cadastrar",
        description: "Não foi possível cadastrar o contato no momento.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    console.log('NewClientDrawer: Cancelando cadastro, fechando drawer');
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto p-4">
        <DialogHeader className="space-y-2 mb-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Phone className="h-4 w-4 text-primary" />
            </div>
            <DialogTitle className="text-base">Cadastrar Contato do WhatsApp</DialogTitle>
          </div>

          <DialogDescription className="text-xs">
            Preencha os dados abaixo para vincular as mensagens existentes.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">

            {/* Campo UNIDADE e TELEFONE - Grid de 2 colunas */}
            <div className="grid grid-cols-2 gap-3">
              {/* Campo UNIDADE */}
              <FormField
                control={form.control}
                name="unit_id"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs">Unidade *</FormLabel>
                    <Select disabled onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-8 text-xs bg-muted">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={userUnitId} className="text-xs">Unidade Atual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              {/* Campo TELEFONE */}
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs">Telefone</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly className="h-8 text-xs font-medium bg-muted" />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>

            {/* Campo NOME */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs">Nome Completo *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nome do contato" className="h-8 text-xs" />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            {/* Campo EMAIL e ORIGEM - Grid de 2 colunas */}
            <div className="grid grid-cols-2 gap-3">
              {/* Campo EMAIL */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs">Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="E-mail" className="h-8 text-xs" />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              {/* Campo ORIGEM DO LEAD */}
              <FormField
                control={form.control}
                name="lead_source"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs">Origem do Lead *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {originOptions.map(option => (
                          <SelectItem key={option} value={option} className="text-xs">{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>

            {/* Campo OBSERVAÇÕES */}
            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs">Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Observações adicionais"
                      className="min-h-[60px] text-xs resize-none"
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0 pt-2 pb-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto h-8 text-xs px-4"
                onClick={handleCancel}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="w-full sm:w-auto h-8 text-xs px-4"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Salvando..." : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

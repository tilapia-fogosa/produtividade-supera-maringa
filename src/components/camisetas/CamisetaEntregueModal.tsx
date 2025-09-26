import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, CalendarDays, User, Shirt } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useResponsaveis } from "@/hooks/use-responsaveis";
import { useEstoque } from "@/hooks/use-estoque.tsx";

const formSchema = z.object({
  tamanho_camiseta: z.string().min(1, "Selecione um tamanho"),
  responsavel_id: z.string().min(1, "Selecione um responsável"),
  responsavel_tipo: z.string().min(1, "Tipo do responsável é obrigatório"),
  responsavel_nome: z.string().min(1, "Nome do responsável é obrigatório"),
  data_entrega: z.date({
    required_error: "Selecione a data da entrega",
  }).refine(
    (date) => date <= new Date(),
    "A data da entrega não pode ser futura"
  ),
  observacoes: z.string().max(500, "Observações devem ter no máximo 500 caracteres").optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CamisetaEntregueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alunoId: string;
  alunoNome: string;
  onSave: (data: FormData & { alunoId: string }) => Promise<void>;
}

export function CamisetaEntregueModal({ 
  open, 
  onOpenChange, 
  alunoId, 
  alunoNome, 
  onSave 
}: CamisetaEntregueModalProps) {
  const [loading, setLoading] = useState(false);
  const { responsaveis, isLoading: responsaveisLoading } = useResponsaveis();
  const { estoqueItems, loading: estoqueLoading } = useEstoque();

  // Filtrar apenas camisetas do estoque
  const camisetasEstoque = estoqueItems.filter(item => item.tipo_item === 'camiseta');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      data_entrega: new Date(),
      observacoes: "",
    },
  });

  const handleSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      await onSave({ ...data, alunoId });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponsavelChange = (value: string) => {
    const responsavel = responsaveis.find(r => r.id === value);
    if (responsavel) {
      form.setValue("responsavel_id", responsavel.id);
      form.setValue("responsavel_tipo", responsavel.tipo);
      form.setValue("responsavel_nome", responsavel.nome);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shirt className="h-5 w-5 text-blue-600" />
            Entregar Camiseta - {alunoNome}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            
            {/* Tamanho da Camiseta */}
            <FormField
              control={form.control}
              name="tamanho_camiseta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Shirt className="h-4 w-4" />
                    Tamanho da Camiseta
                  </FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={estoqueLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={estoqueLoading ? "Carregando..." : "Selecione o tamanho"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {camisetasEstoque.map((item) => (
                        <SelectItem key={item.id} value={item.nome}>
                          {item.nome} {item.quantidade > 0 ? `(${item.quantidade} disponível)` : '(Sem estoque)'}
                        </SelectItem>
                      ))}
                      {camisetasEstoque.length === 0 && !estoqueLoading && (
                        <SelectItem value="" disabled>Nenhuma camiseta encontrada no estoque</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Responsável pela Entrega */}
            <FormField
              control={form.control}
              name="responsavel_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Responsável pela Entrega
                  </FormLabel>
                  <Select 
                    onValueChange={handleResponsavelChange} 
                    defaultValue={field.value}
                    disabled={responsaveisLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={responsaveisLoading ? "Carregando..." : "Selecione o responsável"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {responsaveis.map((responsavel) => (
                        <SelectItem key={responsavel.id} value={responsavel.id}>
                          {responsavel.nome} ({responsavel.tipo === 'professor' ? 'Professor' : 'Funcionário'})
                        </SelectItem>
                      ))}
                      {responsaveis.length === 0 && !responsaveisLoading && (
                        <SelectItem value="" disabled>Nenhum responsável encontrado</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Data da Entrega */}
            <FormField
              control={form.control}
              name="data_entrega"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Data da Entrega
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                          <Calendar className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Observações */}
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações sobre a entrega..."
                      className="resize-none"
                      maxLength={500}
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <div className="text-xs text-muted-foreground text-right">
                    {field.value?.length || 0}/500 caracteres
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? "Salvando..." : "Marcar como Entregue"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
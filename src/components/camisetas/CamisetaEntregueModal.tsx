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
import { useEstoque } from "@/hooks/use-estoque.tsx";
import { useCurrentFuncionario } from "@/hooks/use-current-funcionario";
import { useCamisetas } from "@/hooks/use-camisetas";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  tamanho_camiseta: z.string().min(1, "Selecione um tamanho"),
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
  onSave: (data: { alunoId: string; tamanho_camiseta: string; data_entrega: Date; observacoes?: string; funcionario_registro_id?: string; responsavel_nome?: string }) => Promise<void>;
}

export function CamisetaEntregueModal({
  open,
  onOpenChange,
  alunoId,
  alunoNome,
  onSave
}: CamisetaEntregueModalProps) {
  const [loading, setLoading] = useState(false);
  const [isIgnoring, setIsIgnoring] = useState(false);
  const [diasIgnorar, setDiasIgnorar] = useState<number>(3);
  const { funcionarioId, funcionarioNome } = useCurrentFuncionario();
  const { estoqueItems, loading: estoqueLoading } = useEstoque();
  const { ignorarCamiseta } = useCamisetas();

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
      await onSave({
        alunoId,
        tamanho_camiseta: data.tamanho_camiseta,
        data_entrega: data.data_entrega,
        observacoes: data.observacoes,
        funcionario_registro_id: funcionarioId,
        responsavel_nome: funcionarioNome
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIgnorar = async () => {
    if (!diasIgnorar || diasIgnorar < 1) return;
    try {
      setLoading(true);
      await ignorarCamiseta(alunoId, diasIgnorar);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao ignorar:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto w-full">
        <DialogHeader className="mb-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Shirt className="h-4 w-4 text-blue-600" />
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
                  <FormLabel className="flex items-center gap-2 text-sm">
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

            {/* Responsável pela Entrega - automático */}
            <div className="space-y-2">
              <FormLabel className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                Responsável pela Entrega
              </FormLabel>
              <p className="text-xs text-muted-foreground bg-muted px-3 py-2 rounded-md">
                {funcionarioNome || 'Carregando...'}
              </p>
            </div>

            {/* Data da Entrega */}
            <FormField
              control={form.control}
              name="data_entrega"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-2 text-sm">
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
                  <FormLabel className="text-sm">Observações (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações sobre a entrega..."
                      className="resize-none text-sm"
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

            <div className="flex flex-col gap-2 w-full mt-6 pt-4 border-t">
              <div className="flex gap-2 w-full">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsIgnoring(!isIgnoring)}
                  disabled={loading}
                  className="w-1/2 text-white text-xs px-2 whitespace-normal h-auto py-2"
                  style={{ backgroundColor: isIgnoring ? '#4b5563' : '#4f46e5' }}
                >
                  {isIgnoring ? "Cancelar Ignorar" : "Ignorar Temp."}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="w-1/2 text-sm h-auto py-2"
                >
                  Cancelar
                </Button>
              </div>

              <Button
                type="submit"
                disabled={loading || isIgnoring}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-sm h-10"
              >
                {loading ? "Salvando..." : "Entregar Camiseta"}
              </Button>
            </div>

            {isIgnoring && (
              <div className="flex flex-col gap-3 p-4 bg-muted/50 rounded-lg mt-4 border border-border">
                <div className="flex-1 space-y-2">
                  <FormLabel className="text-xs">Dias para ocultar a tarefa</FormLabel>
                  <Input
                    type="number"
                    min={1}
                    value={diasIgnorar}
                    onChange={(e) => setDiasIgnorar(e.target.valueAsNumber)}
                    className="w-full"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleIgnorar}
                  disabled={loading || !diasIgnorar || diasIgnorar < 1}
                  className="w-full"
                >
                  Confirmar Ocultação
                </Button>
              </div>
            )}

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
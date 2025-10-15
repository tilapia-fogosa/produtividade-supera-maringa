import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useIgnorarColetaAH } from "@/hooks/use-ignorar-coleta-ah";

const ignorarColetaSchema = z.object({
  dias: z.number().min(1, "Informe pelo menos 1 dia").max(365, "Máximo de 365 dias"),
  motivo: z.string().min(3, "Motivo deve ter pelo menos 3 caracteres"),
  responsavel: z.string().min(3, "Responsável deve ter pelo menos 3 caracteres"),
});

type IgnorarColetaForm = z.infer<typeof ignorarColetaSchema>;

interface IgnorarColetaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pessoaId: string;
  pessoaNome: string;
}

export const IgnorarColetaModal = ({ 
  open, 
  onOpenChange, 
  pessoaId,
  pessoaNome 
}: IgnorarColetaModalProps) => {
  const { mutate: ignorarColeta, isPending } = useIgnorarColetaAH();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<IgnorarColetaForm>({
    resolver: zodResolver(ignorarColetaSchema),
    defaultValues: {
      dias: 7,
      motivo: "",
      responsavel: ""
    }
  });

  const onSubmit = (data: IgnorarColetaForm) => {
    ignorarColeta({
      pessoaId,
      dias: data.dias,
      motivo: data.motivo,
      responsavel: data.responsavel
    }, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      }
    });
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ignorar Coleta Temporariamente</DialogTitle>
          <DialogDescription>
            Defina por quantos dias {pessoaNome} não deve aparecer na lista de próximas coletas
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dias">
              Quantidade de dias <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dias"
              type="number"
              min={1}
              max={365}
              {...register("dias", { valueAsNumber: true })}
            />
            {errors.dias && (
              <p className="text-sm text-destructive">{errors.dias.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">
              Motivo <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="motivo"
              placeholder="Ex: Aluno em viagem, Aguardando retorno, etc."
              rows={3}
              {...register("motivo")}
            />
            {errors.motivo && (
              <p className="text-sm text-destructive">{errors.motivo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsavel">
              Responsável <span className="text-destructive">*</span>
            </Label>
            <Input
              id="responsavel"
              placeholder="Seu nome"
              {...register("responsavel")}
            />
            {errors.responsavel && (
              <p className="text-sm text-destructive">{errors.responsavel.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Ignorar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};


import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Award, Loader2 } from 'lucide-react';
import { usePendenciasBotom } from '@/hooks/use-pendencias-botom';
import { useCurrentFuncionario } from '@/hooks/use-current-funcionario';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface EntregaBotomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendenciaId: string;
  alunoNome: string;
  apostilaNova: string;
  onSuccess?: () => void;
}

export const EntregaBotomModal: React.FC<EntregaBotomModalProps> = ({
  open,
  onOpenChange,
  pendenciaId,
  alunoNome,
  apostilaNova,
  onSuccess,
}) => {
  const { confirmarEntrega, isConfirmando, ignorarBotom } = usePendenciasBotom();
  const { funcionarioId } = useCurrentFuncionario();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isIgnoring, setIsIgnoring] = useState(false);
  const [diasIgnorar, setDiasIgnorar] = useState<number>(3);

  const handleConfirmar = async () => {
    if (!pendenciaId) return;

    setIsSubmitting(true);
    try {
      await confirmarEntrega({
        pendenciaId,
        funcionarioRegistroId: funcionarioId || undefined,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao confirmar entrega do botom:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIgnorar = async () => {
    if (!pendenciaId || !diasIgnorar || diasIgnorar < 1) return;

    setIsSubmitting(true);
    try {
      await ignorarBotom({ pendenciaId, dias: diasIgnorar });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao ignorar botom:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            Entregar Botom
          </DialogTitle>
          <DialogDescription>
            Confirme a entrega do botom para o aluno abaixo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <Award className="h-10 w-10 text-amber-500 shrink-0" />
            <div>
              <p className="font-semibold text-foreground">{alunoNome}</p>
              <p className="text-sm text-muted-foreground">
                Avançou para: <span className="font-medium text-amber-600 dark:text-amber-400">{apostilaNova}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full mt-6 pt-4 border-t">
          <div className="flex gap-2 w-full">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsIgnoring(!isIgnoring)}
              disabled={isSubmitting || isConfirmando}
              className="w-1/2 text-white text-xs px-2 whitespace-normal h-auto py-2"
              style={{ backgroundColor: isIgnoring ? '#4b5563' : '#4f46e5' }}
            >
              {isIgnoring ? "Cancelar Ignorar" : "Ignorar Temp."}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || isConfirmando}
              className="w-1/2 text-sm h-auto py-2"
            >
              Cancelar
            </Button>
          </div>

          <Button
            onClick={handleConfirmar}
            disabled={isSubmitting || isConfirmando || isIgnoring}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white text-sm h-10"
          >
            {(isSubmitting || isConfirmando) ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : "Confirmar Entrega do Botom"}
          </Button>
        </div>

        {isIgnoring && (
          <div className="flex flex-col gap-3 p-4 bg-muted/50 rounded-lg mt-4 border border-border">
            <div className="flex-1 space-y-2">
              <Label className="text-xs">Dias para ocultar a tarefa</Label>
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
              disabled={isSubmitting || isConfirmando || !diasIgnorar || diasIgnorar < 1}
              className="w-full"
            >
              Confirmar Ocultação
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

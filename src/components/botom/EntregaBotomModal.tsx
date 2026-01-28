
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Award, Loader2 } from 'lucide-react';
import { usePendenciasBotom } from '@/hooks/use-pendencias-botom';
import { useCurrentFuncionario } from '@/hooks/use-current-funcionario';

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
  const { confirmarEntrega, isConfirmando } = usePendenciasBotom();
  const { funcionarioId } = useCurrentFuncionario();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting || isConfirmando}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmar}
            disabled={isSubmitting || isConfirmando}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {(isSubmitting || isConfirmando) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Confirmar Entrega
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAhEntrega } from "@/hooks/use-ah-entrega";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/hooks/use-current-user";
import { User } from "lucide-react";

interface EntregaAhModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apostilaRecolhidaId: string;
  apostilaNome: string;
  pessoaNome: string;
}

export const EntregaAhModal = ({
  open,
  onOpenChange,
  apostilaRecolhidaId,
  apostilaNome,
  pessoaNome,
}: EntregaAhModalProps) => {
  const [dataEntrega, setDataEntrega] = useState("");
  const [isIgnoring, setIsIgnoring] = useState(false);
  const [diasIgnorar, setDiasIgnorar] = useState<number>(3);

  const { registrarEntregaAH, ignorarEntregaAH, isLoading } = useAhEntrega();
  const { userId: funcionarioId, userName, isLoading: loadingUser, isAuthenticated } = useCurrentUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!funcionarioId) {
      return;
    }

    await registrarEntregaAH.mutateAsync({
      apostilaRecolhidaId,
      dataEntrega,
      funcionarioRegistroId: funcionarioId,
    });

    // Limpar formulário e fechar modal
    setDataEntrega("");
    onOpenChange(false);
  };

  const handleIgnorar = async () => {
    if (!diasIgnorar || diasIgnorar < 1) return;
    try {
      await ignorarEntregaAH({ apostilaRecolhidaId, dias: diasIgnorar });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao ignorar entrega AH:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-lg">
        <DialogHeader>
          <DialogTitle>Registrar Entrega de Apostila</DialogTitle>
          <DialogDescription>
            Registre a entrega da apostila corrigida para {pessoaNome}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Apostila</Label>
            <Badge variant="outline" className="text-base">
              {apostilaNome}
            </Badge>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataEntrega">
              Data de Entrega <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dataEntrega"
              type="date"
              value={dataEntrega}
              onChange={(e) => setDataEntrega(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Responsável pela Entrega</Label>
            <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-muted">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {loadingUser ? 'Carregando...' : userName || 'Usuário não identificado'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full mt-6 pt-4 border-t">
            <div className="flex gap-2 w-full">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsIgnoring(!isIgnoring)}
                disabled={isLoading}
                className="w-1/2 text-white text-xs px-2 whitespace-normal h-auto py-2"
                style={{ backgroundColor: isIgnoring ? '#4b5563' : '#4f46e5' }}
              >
                {isIgnoring ? "Cancelar Ignorar" : "Ignorar Temp."}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="w-1/2 text-sm h-auto py-2"
              >
                Cancelar
              </Button>
            </div>

            <Button
              type="submit"
              disabled={isLoading || isIgnoring || !isAuthenticated || !dataEntrega}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm h-10"
            >
              {isLoading ? "Registrando..." : "Registrar Entrega de AH"}
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
                disabled={isLoading || !diasIgnorar || diasIgnorar < 1}
                className="w-full"
              >
                Confirmar Ocultação
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};
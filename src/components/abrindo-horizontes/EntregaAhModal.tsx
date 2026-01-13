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

export const EntregaAhModal: React.FC<EntregaAhModalProps> = ({
  open,
  onOpenChange,
  apostilaRecolhidaId,
  apostilaNome,
  pessoaNome,
}) => {
  const [dataEntrega, setDataEntrega] = useState("");

  const { registrarEntregaAH, isLoading } = useAhEntrega();
  const { userId, userName, isLoading: loadingUser, isAuthenticated } = useCurrentUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      return;
    }

    await registrarEntregaAH.mutateAsync({
      apostilaRecolhidaId,
      dataEntrega,
      funcionarioRegistroId: userId,
    });

    // Limpar formulário e fechar modal
    setDataEntrega("");
    onOpenChange(false);
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !isAuthenticated || !dataEntrega}>
              {isLoading ? "Salvando..." : "Registrar Entrega"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
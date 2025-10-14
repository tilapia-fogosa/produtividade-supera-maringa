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
  const [responsavelNome, setResponsavelNome] = useState("");

  const { registrarEntregaAH, isLoading } = useAhEntrega();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await registrarEntregaAH.mutateAsync({
      apostilaRecolhidaId,
      dataEntrega,
      responsavelNome,
    });

    // Limpar formulário e fechar modal
    setDataEntrega("");
    setResponsavelNome("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
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
              type="datetime-local"
              value={dataEntrega}
              onChange={(e) => setDataEntrega(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsavelNome">
              Responsável pela Entrega <span className="text-destructive">*</span>
            </Label>
            <Input
              id="responsavelNome"
              type="text"
              placeholder="Nome de quem entregou a apostila"
              value={responsavelNome}
              onChange={(e) => setResponsavelNome(e.target.value)}
              required
            />
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Registrar Entrega"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

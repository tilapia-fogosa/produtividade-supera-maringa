import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClienteMatriculado } from "@/hooks/use-pos-matricula";
import { DadosCadastraisForm } from "./DadosCadastraisForm";
import { DadosComercaisForm } from "./DadosComercaisForm";

export type ModalType = "cadastrais" | "comerciais" | "pedagogicos";

interface PosMatriculaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: ModalType | null;
  cliente: ClienteMatriculado | null;
}

const modalTitles: Record<ModalType, string> = {
  cadastrais: "Dados Cadastrais",
  comerciais: "Dados Comerciais",
  pedagogicos: "Dados Pedagógicos",
};

export function PosMatriculaModal({
  open,
  onOpenChange,
  tipo,
  cliente,
}: PosMatriculaModalProps) {
  if (!tipo || !cliente) return null;

  const handleClose = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{modalTitles[tipo]}</DialogTitle>
          <p className="text-sm text-muted-foreground">{cliente.name}</p>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 pb-6">
          <div className="mt-6">
            {tipo === "cadastrais" && (
              <DadosCadastraisForm cliente={cliente} onCancel={handleClose} />
            )}
            {tipo === "comerciais" && (
              <DadosComercaisForm cliente={cliente} onCancel={handleClose} />
            )}
            {tipo === "pedagogicos" && (
              <p className="text-muted-foreground text-sm">
                Formulário de Dados Pedagógicos será implementado aqui.
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

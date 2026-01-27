import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClienteMatriculado } from "@/hooks/use-pos-matricula";
import { DadosCadastraisForm } from "./DadosCadastraisForm";
import { DadosComercaisForm } from "./DadosComercaisForm";

export type DrawerType = "cadastrais" | "comerciais" | "pedagogicos";

interface PosMatriculaDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: DrawerType | null;
  cliente: ClienteMatriculado | null;
}

const drawerTitles: Record<DrawerType, string> = {
  cadastrais: "Dados Cadastrais",
  comerciais: "Dados Comerciais",
  pedagogicos: "Dados Pedagógicos",
};

export function PosMatriculaDrawer({
  open,
  onOpenChange,
  tipo,
  cliente,
}: PosMatriculaDrawerProps) {
  if (!tipo || !cliente) return null;

  const handleClose = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-3xl p-0 flex flex-col">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle>{drawerTitles[tipo]}</SheetTitle>
          <p className="text-sm text-muted-foreground">{cliente.name}</p>
        </SheetHeader>

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
      </SheetContent>
    </Sheet>
  );
}

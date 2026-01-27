import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ClienteMatriculado } from "@/hooks/use-pos-matricula";

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-md">
        <SheetHeader>
          <SheetTitle>{drawerTitles[tipo]}</SheetTitle>
          <p className="text-sm text-muted-foreground">{cliente.name}</p>
        </SheetHeader>

        <div className="mt-6">
          {tipo === "cadastrais" && (
            <p className="text-muted-foreground text-sm">
              Formulário de Dados Cadastrais será implementado aqui.
            </p>
          )}
          {tipo === "comerciais" && (
            <p className="text-muted-foreground text-sm">
              Formulário de Dados Comerciais será implementado aqui.
            </p>
          )}
          {tipo === "pedagogicos" && (
            <p className="text-muted-foreground text-sm">
              Formulário de Dados Pedagógicos será implementado aqui.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

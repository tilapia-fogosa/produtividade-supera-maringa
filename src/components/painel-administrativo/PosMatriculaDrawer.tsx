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
import { DadosPedagogicosForm } from "./DadosPedagogicosForm";
import { DollarSign, User, GraduationCap } from "lucide-react";

export type DrawerType = "cadastrais" | "comerciais" | "pedagogicos";

interface PosMatriculaDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: DrawerType | null;
  cliente: ClienteMatriculado | null;
}

const drawerConfig: Record<DrawerType, { title: string; icon: React.ReactNode }> = {
  cadastrais: { title: "Dados Cadastrais", icon: <User className="h-5 w-5" /> },
  comerciais: { title: "Dados Comerciais", icon: <DollarSign className="h-5 w-5" /> },
  pedagogicos: { title: "Dados Pedagógicos", icon: <GraduationCap className="h-5 w-5" /> },
};

export function PosMatriculaDrawer({
  open,
  onOpenChange,
  tipo,
  cliente,
}: PosMatriculaDrawerProps) {
  if (!tipo || !cliente) return null;

  const handleClose = () => onOpenChange(false);
  const config = drawerConfig[tipo];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px] sm:max-w-[480px] p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-2 text-primary">
            {config.icon}
            <SheetTitle>{config.title}</SheetTitle>
          </div>
          <p className="text-sm text-muted-foreground">{cliente.name}</p>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 pb-6">
          <div className="mt-4">
            {tipo === "cadastrais" && (
              <DadosCadastraisForm cliente={cliente} onCancel={handleClose} />
            )}
            {tipo === "comerciais" && (
              <DadosComercaisForm cliente={cliente} onCancel={handleClose} />
            )}
            {tipo === "pedagogicos" && (
              <DadosPedagogicosForm cliente={cliente} onCancel={handleClose} />
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
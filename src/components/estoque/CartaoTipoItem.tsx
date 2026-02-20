
import React from "react";
import { Card } from "@/components/ui/card";
import { TabelaEstoque } from "./TabelaEstoque";
import { EstoqueItem, getTipoColor, getTipoTitle } from "@/hooks/use-estoque";

interface CartaoTipoItemProps {
  tipo: string;
  items: EstoqueItem[];
  alterarQuantidade: (id: string, incremento: number) => Promise<void>;
}

export function CartaoTipoItem({ tipo, items, alterarQuantidade }: CartaoTipoItemProps) {
  return (
    <Card className={`p-1 border-2 ${getTipoColor(tipo)}`}>
      <h2 className="text-sm font-semibold mb-1 px-1">{getTipoTitle(tipo)}</h2>
      <TabelaEstoque items={items} alterarQuantidade={alterarQuantidade} />
    </Card>
  );
}

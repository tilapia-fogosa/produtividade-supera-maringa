
import React, { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { APOSTILAS_ABACO, APOSTILAS_AH } from "@/components/turmas/constants/apostilas";

interface EstoqueItem {
  nome: string;
  quantidade: number;
}

const Estoque = () => {
  const [estoqueAbaco, setEstoqueAbaco] = useState<EstoqueItem[]>(
    APOSTILAS_ABACO.map(nome => ({ nome, quantidade: 0 }))
  );
  
  const [estoqueAH, setEstoqueAH] = useState<EstoqueItem[]>(
    APOSTILAS_AH.map(nome => ({ nome, quantidade: 0 }))
  );

  const alterarQuantidade = (tipo: 'abaco' | 'ah', index: number, incremento: number) => {
    if (tipo === 'abaco') {
      const novoEstoque = [...estoqueAbaco];
      novoEstoque[index].quantidade = Math.max(0, novoEstoque[index].quantidade + incremento);
      setEstoqueAbaco(novoEstoque);
    } else {
      const novoEstoque = [...estoqueAH];
      novoEstoque[index].quantidade = Math.max(0, novoEstoque[index].quantidade + incremento);
      setEstoqueAH(novoEstoque);
    }
  };

  const ListaApostilas = ({ items, tipo }: { items: EstoqueItem[], tipo: 'abaco' | 'ah' }) => (
    <div className="space-y-2">
      {items.map((item, index) => (
        <Card key={item.nome} className="p-4 flex items-center justify-between">
          <span className="text-sm font-medium">{item.nome}</span>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900 rounded-md">
              {item.quantidade}
            </span>
            <div className="flex space-x-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => alterarQuantidade(tipo, index, -1)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => alterarQuantidade(tipo, index, 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Estoque</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Apostilas de Ábaco</h2>
          <ListaApostilas items={estoqueAbaco} tipo="abaco" />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Apostilas Abrindo Horizontes</h2>
          <ListaApostilas items={estoqueAH} tipo="ah" />
        </section>
      </div>
    </div>
  );
};

export default Estoque;

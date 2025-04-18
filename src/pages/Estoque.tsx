
import React, { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { APOSTILAS_ABACO, APOSTILAS_AH } from "@/components/turmas/constants/apostilas";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";

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

  const TabelaEstoque = ({ items, tipo }: { items: EstoqueItem[], tipo: 'abaco' | 'ah' }) => (
    <Table>
      <TableBody>
        {items.map((item, index) => (
          <TableRow 
            key={item.nome}
            className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}
          >
            <TableCell className="py-2">
              <span className="text-xs font-medium">{item.nome}</span>
            </TableCell>
            <TableCell className="py-2 text-right">
              <div className="flex items-center justify-end space-x-2">
                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 rounded text-xs min-w-[2rem] text-center">
                  {item.quantidade}
                </span>
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => alterarQuantidade(tipo, index, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => alterarQuantidade(tipo, index, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="container mx-auto p-2">
      <h1 className="text-xl font-bold mb-4">Estoque</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">Apostilas de Ábaco</h2>
          <TabelaEstoque items={estoqueAbaco} tipo="abaco" />
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">Apostilas Abrindo Horizontes</h2>
          <TabelaEstoque items={estoqueAH} tipo="ah" />
        </Card>
      </div>
    </div>
  );
};

export default Estoque;

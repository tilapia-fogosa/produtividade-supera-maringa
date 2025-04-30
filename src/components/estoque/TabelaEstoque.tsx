
import React from "react";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { EstoqueItem } from "@/hooks/use-estoque";

interface TabelaEstoqueProps {
  items: EstoqueItem[];
  alterarQuantidade: (id: string, incremento: number) => Promise<void>;
}

export function TabelaEstoque({ items, alterarQuantidade }: TabelaEstoqueProps) {
  return (
    <Table>
      <TableBody>
        {items.map((item) => (
          <TableRow 
            key={item.id}
            className={items.indexOf(item) % 2 === 0 
              ? 'bg-white dark:bg-[#221000] dark:border-laranja-DEFAULT/30' 
              : 'bg-gray-50 dark:bg-[#2A1300] dark:border-laranja-DEFAULT/30'}
          >
            <TableCell className="py-0.5 text-xs w-[60%] max-w-[150px] truncate">
              <span className="font-medium text-foreground dark:text-white text-xs">{item.nome}</span>
            </TableCell>
            <TableCell className="py-0.5 text-right w-[40%] max-w-[90px]">
              <div className="flex items-center justify-end space-x-1">
                <span className="px-1 py-0.5 bg-laranja-DEFAULT/20 dark:bg-laranja-DEFAULT text-foreground dark:text-white rounded text-xs min-w-[1.5rem] text-center font-medium">
                  {item.quantidade}
                </span>
                <div className="flex space-x-0.5">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-4 w-4 border-roxo-DEFAULT text-roxo-DEFAULT bg-white hover:bg-roxo-DEFAULT hover:text-white dark:border-laranja-light dark:text-laranja-light dark:bg-[#3D1800] dark:hover:bg-laranja-DEFAULT p-0 flex items-center justify-center"
                    onClick={() => alterarQuantidade(item.id, -1)}
                  >
                    <Minus className="h-2 w-2 stroke-[3]" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-4 w-4 border-roxo-DEFAULT text-roxo-DEFAULT bg-white hover:bg-roxo-DEFAULT hover:text-white dark:border-laranja-light dark:text-laranja-light dark:bg-[#3D1800] dark:hover:bg-laranja-DEFAULT p-0 flex items-center justify-center"
                    onClick={() => alterarQuantidade(item.id, 1)}
                  >
                    <Plus className="h-2 w-2 stroke-[3]" />
                  </Button>
                </div>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

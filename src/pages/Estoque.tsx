
import React, { useState, useEffect } from "react";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { APOSTILAS_AH } from "@/components/turmas/constants/apostilas";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

interface EstoqueItem {
  nome: string;
  quantidade: number;
}

const Estoque = () => {
  const [estoqueAbaco, setEstoqueAbaco] = useState<EstoqueItem[]>([]);
  const [estoqueAH, setEstoqueAH] = useState<EstoqueItem[]>(
    APOSTILAS_AH.map(nome => ({ nome, quantidade: 0 }))
  );
  const [estoqueJogos, setEstoqueJogos] = useState<EstoqueItem[]>([
    { nome: "Dominó", quantidade: 0 },
    { nome: "Jogo da Memória", quantidade: 0 },
    { nome: "Quebra-Cabeça", quantidade: 0 },
  ]);
  const [estoqueItems, setEstoqueItems] = useState<EstoqueItem[]>([
    { nome: "Ábaco", quantidade: 0 },
    { nome: "Lápis", quantidade: 0 },
    { nome: "Borracha", quantidade: 0 },
  ]);

  useEffect(() => {
    const fetchApostilas = async () => {
      const { data, error } = await supabase
        .from('apostilas')
        .select('nome')
        .order('nome');
      
      if (data && !error) {
        setEstoqueAbaco(data.map(apostila => ({
          nome: apostila.nome,
          quantidade: 0
        })));
      }
    };

    fetchApostilas();
  }, []);

  const alterarQuantidade = (tipo: 'abaco' | 'ah' | 'jogos' | 'items', index: number, incremento: number) => {
    const setEstoque = {
      'abaco': setEstoqueAbaco,
      'ah': setEstoqueAH,
      'jogos': setEstoqueJogos,
      'items': setEstoqueItems
    }[tipo];
    
    setEstoque(estoqueAtual => {
      const novoEstoque = [...estoqueAtual];
      novoEstoque[index].quantidade = Math.max(0, novoEstoque[index].quantidade + incremento);
      return novoEstoque;
    });
  };

  const TabelaEstoque = ({ items, tipo }: { items: EstoqueItem[], tipo: 'abaco' | 'ah' | 'jogos' | 'items' }) => (
    <Table>
      <TableBody>
        {items.map((item, index) => (
          <TableRow 
            key={item.nome}
            className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}
          >
            <TableCell className="py-1 text-xs">
              <span className="font-medium">{item.nome}</span>
            </TableCell>
            <TableCell className="py-1 text-right">
              <div className="flex items-center justify-end space-x-1">
                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 rounded text-xs min-w-[2rem] text-center">
                  {item.quantidade}
                </span>
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => alterarQuantidade(tipo, index, -1)}
                  >
                    <Minus className="h-2 w-2" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => alterarQuantidade(tipo, index, 1)}
                  >
                    <Plus className="h-2 w-2" />
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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <Card className="p-2">
          <h2 className="text-sm font-semibold mb-2">Apostilas de Ábaco</h2>
          <TabelaEstoque items={estoqueAbaco} tipo="abaco" />
        </Card>

        <Card className="p-2">
          <h2 className="text-sm font-semibold mb-2">Abrindo Horizontes</h2>
          <TabelaEstoque items={estoqueAH} tipo="ah" />
        </Card>

        <Card className="p-2">
          <h2 className="text-sm font-semibold mb-2">Jogos</h2>
          <TabelaEstoque items={estoqueJogos} tipo="jogos" />
        </Card>

        <Card className="p-2">
          <h2 className="text-sm font-semibold mb-2">Items</h2>
          <TabelaEstoque items={estoqueItems} tipo="items" />
        </Card>
      </div>
    </div>
  );
};

export default Estoque;

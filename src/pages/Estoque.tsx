
import React, { useState, useEffect } from "react";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface EstoqueItem {
  id: string;
  nome: string;
  tipo_item: string;
  quantidade: number;
}

const Estoque = () => {
  const [estoqueItems, setEstoqueItems] = useState<EstoqueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEstoqueItems();
  }, []);

  const fetchEstoqueItems = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('estoque')
        .select('*')
        .order('nome');
      
      if (error) {
        console.error('Erro ao buscar itens de estoque:', error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar estoque",
          description: "Não foi possível carregar os itens do estoque."
        });
        return;
      }

      setEstoqueItems(data || []);
    } catch (error) {
      console.error('Erro ao buscar itens de estoque:', error);
    } finally {
      setLoading(false);
    }
  };

  const alterarQuantidade = async (id: string, incremento: number) => {
    // Encontrar o item atual no estado
    const itemIndex = estoqueItems.findIndex(item => item.id === id);
    if (itemIndex === -1) return;
    
    const item = estoqueItems[itemIndex];
    const novaQuantidade = Math.max(0, item.quantidade + incremento);
    
    // Atualizar o estado localmente primeiro para resposta imediata na UI
    const novosItems = [...estoqueItems];
    novosItems[itemIndex] = { ...item, quantidade: novaQuantidade };
    setEstoqueItems(novosItems);
    
    // Atualizar no banco de dados
    try {
      const { error } = await supabase
        .from('estoque')
        .update({ quantidade: novaQuantidade })
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao atualizar quantidade:', error);
        // Reverter alteração no estado em caso de erro
        setEstoqueItems(estoqueItems);
        toast({
          variant: "destructive",
          title: "Erro ao atualizar estoque",
          description: "Não foi possível atualizar a quantidade do item."
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
      setEstoqueItems(estoqueItems); // Reverter em caso de erro
    }
  };

  // Agrupar itens por tipo
  const itemsPorTipo = estoqueItems.reduce((acc, item) => {
    const tipo = item.tipo_item;
    if (!acc[tipo]) {
      acc[tipo] = [];
    }
    acc[tipo].push(item);
    return acc;
  }, {} as Record<string, EstoqueItem[]>);

  const getTipoTitle = (tipo: string): string => {
    switch (tipo) {
      case 'apostila_abaco':
        return 'Apostilas de Ábaco';
      case 'apostila_ah':
        return 'Abrindo Horizontes';
      case 'jogo':
        return 'Jogos';
      case 'item':
        return 'Items';
      case 'kit':
        return 'Kits de Material';
      default:
        return tipo.charAt(0).toUpperCase() + tipo.slice(1);
    }
  };

  const TabelaEstoque = ({ items }: { items: EstoqueItem[] }) => (
    <Table>
      <TableBody>
        {items.map((item) => (
          <TableRow 
            key={item.id}
            className={items.indexOf(item) % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}
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
                    onClick={() => alterarQuantidade(item.id, -1)}
                  >
                    <Minus className="h-2 w-2" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => alterarQuantidade(item.id, 1)}
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

  if (loading) {
    return (
      <div className="container mx-auto p-2">
        <h1 className="text-xl font-bold mb-4">Estoque</h1>
        <p className="text-center py-8">Carregando itens...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-2">
      <h1 className="text-xl font-bold mb-4">Estoque</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {Object.entries(itemsPorTipo).map(([tipo, items]) => (
          <Card key={tipo} className="p-2">
            <h2 className="text-sm font-semibold mb-2">{getTipoTitle(tipo)}</h2>
            <TabelaEstoque items={items} />
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Estoque;

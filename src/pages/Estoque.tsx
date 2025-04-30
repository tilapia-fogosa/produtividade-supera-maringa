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
    const itemIndex = estoqueItems.findIndex(item => item.id === id);
    if (itemIndex === -1) return;
    
    const item = estoqueItems[itemIndex];
    const novaQuantidade = Math.max(0, item.quantidade + incremento);
    
    const novosItems = [...estoqueItems];
    novosItems[itemIndex] = { ...item, quantidade: novaQuantidade };
    setEstoqueItems(novosItems);
    
    try {
      const { error } = await supabase
        .from('estoque')
        .update({ quantidade: novaQuantidade })
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao atualizar quantidade:', error);
        setEstoqueItems(estoqueItems);
        toast({
          variant: "destructive",
          title: "Erro ao atualizar estoque",
          description: "Não foi possível atualizar a quantidade do item."
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
      setEstoqueItems(estoqueItems);
    }
  };

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

  const getTipoColor = (tipo: string): string => {
    switch (tipo) {
      case 'apostila_abaco':
        return 'bg-[#5A2700] border-laranja-DEFAULT text-laranja-light';
      case 'apostila_ah':
        return 'bg-[#A34900] border-laranja-DEFAULT text-white';
      case 'jogo':
        return 'bg-[#311D64] border-roxo-light text-white';
      case 'kit':
        return 'bg-[#4E2CA3] border-roxo-DEFAULT text-white';
      case 'item':
        return 'bg-[#4B4B24] border-cinza-medium text-white';
      default:
        return 'bg-[#603808] border-supera-600 text-white';
    }
  };

  const TabelaEstoque = ({ items }: { items: EstoqueItem[] }) => (
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

  if (loading) {
    return (
      <div className="container mx-auto p-2 dark:bg-[#2A120B]">
        <h1 className="text-xl font-bold mb-4 text-laranja-DEFAULT dark:text-laranja-light">Estoque</h1>
        <p className="text-center py-8 text-muted-foreground dark:text-white">Carregando itens...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-2 dark:bg-[#2A120B] min-h-screen">
      <h1 className="text-xl font-bold mb-2 text-laranja-DEFAULT dark:text-laranja-light">Estoque</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {Object.entries(itemsPorTipo).map(([tipo, items]) => (
          <Card key={tipo} className={`p-1 border-2 ${getTipoColor(tipo)}`}>
            <h2 className="text-sm font-semibold mb-1 px-1">{getTipoTitle(tipo)}</h2>
            <TabelaEstoque items={items} />
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Estoque;

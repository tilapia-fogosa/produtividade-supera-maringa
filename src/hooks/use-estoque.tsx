
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export interface EstoqueItem {
  id: string;
  nome: string;
  tipo_item: string;
  quantidade: number;
}

export function useEstoque() {
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

  // Agrupar itens por tipo
  const itemsPorTipo = estoqueItems.reduce((acc, item) => {
    const tipo = item.tipo_item;
    if (!acc[tipo]) {
      acc[tipo] = [];
    }
    acc[tipo].push(item);
    return acc;
  }, {} as Record<string, EstoqueItem[]>);

  return {
    estoqueItems,
    loading,
    itemsPorTipo,
    alterarQuantidade
  };
}

export function getTipoTitle(tipo: string): string {
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
    case 'camiseta':
      return 'Camisetas';
    default:
      return tipo.charAt(0).toUpperCase() + tipo.slice(1);
  }
};

export function getTipoColor(tipo: string): string {
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
    case 'camiseta':
      return 'bg-[#1E40AF] border-blue-400 text-white';
    default:
      return 'bg-[#603808] border-supera-600 text-white';
  }
};

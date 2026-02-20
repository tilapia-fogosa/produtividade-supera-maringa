
import React from "react";
import { CartaoTipoItem } from "@/components/estoque/CartaoTipoItem";
import { useEstoque } from "@/hooks/use-estoque";

const Estoque = () => {
  const { loading, itemsPorTipo, alterarQuantidade } = useEstoque();

  if (loading) {
    return (
      <div className="container mx-auto p-2 bg-background dark:bg-background">
        <h1 className="text-xl font-bold mb-4 text-laranja-DEFAULT dark:text-laranja-light">Estoque</h1>
        <p className="text-center py-8 text-muted-foreground dark:text-white">Carregando itens...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-2 bg-background dark:bg-background min-h-screen">
      <h1 className="text-xl font-bold mb-2 text-laranja-DEFAULT dark:text-laranja-light">Estoque</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {Object.entries(itemsPorTipo).map(([tipo, items]) => (
          <CartaoTipoItem 
            key={tipo} 
            tipo={tipo} 
            items={items} 
            alterarQuantidade={alterarQuantidade} 
          />
        ))}
      </div>
    </div>
  );
};

export default Estoque;

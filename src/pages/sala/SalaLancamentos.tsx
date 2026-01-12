
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";

const SalaLancamentos = () => {
  const navigate = useNavigate();

  const handleProdutividadeClick = () => {
    navigate('/sala/dias-lancamento');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-foreground">Lançamentos</h1>
      
      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-foreground">Selecione o tipo de lançamento</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Button 
            size="lg"
            className="w-full py-8 text-lg bg-primary hover:bg-primary/90"
            onClick={handleProdutividadeClick}
          >
            <ClipboardList className="mr-2 h-6 w-6" />
            Produtividade de Sala
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalaLancamentos;

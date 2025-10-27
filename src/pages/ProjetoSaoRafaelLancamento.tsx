import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

const ProjetoSaoRafaelLancamento = () => {
  const navigate = useNavigate();

  const irParaDevolutiva = () => {
    navigate('/projeto-sao-rafael-devolutiva');
  };

  return (
    <div className="container mx-auto py-4 px-2">
      <h1 className="text-2xl font-bold mb-6 text-azul-500">Projeto São Rafael</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-orange-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-azul-500">Devolutiva Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Acesse o relatório mensal do Projeto São Rafael com dados de Ábaco e Abrindo Horizontes.
            </p>
            <Button 
              onClick={irParaDevolutiva}
              className="w-full bg-azul-500 hover:bg-azul-600 text-white"
            >
              <GraduationCap className="mr-2 h-4 w-4" />
              Ver Devolutiva
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjetoSaoRafaelLancamento;


import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, ArrowLeft } from "lucide-react";

const diasSemana = [
  { id: 'segunda', nome: 'Segunda-feira' },
  { id: 'terca', nome: 'Terça-feira' },
  { id: 'quarta', nome: 'Quarta-feira' },
  { id: 'quinta', nome: 'Quinta-feira' },
  { id: 'sexta', nome: 'Sexta-feira' },
  { id: 'sabado', nome: 'Sábado' },
];

const SalaDiasLancamento = () => {
  const navigate = useNavigate();

  const handleDiaClick = (dia: string) => {
    console.log("[Sala] Navegando para turmas do dia:", dia);
    navigate('/sala/turmas/dia', { 
      state: { dia }
    });
  };

  const handleVoltar = () => {
    navigate('/sala/lancamentos');
  };

  return (
    <div className="container mx-auto p-4">
      <Button 
        onClick={handleVoltar} 
        variant="outline" 
        className="mb-4 border-border"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>
      
      <h1 className="text-2xl font-bold mb-6 text-foreground">
        Lançar Produtividade de Sala
      </h1>
      
      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-foreground">Selecione o dia da semana</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 p-6">
          {diasSemana.map((dia) => (
            <Button 
              key={dia.id}
              size="lg"
              variant="outline"
              className="py-8 text-lg border-border"
              onClick={() => handleDiaClick(dia.id)}
            >
              <CalendarDays className="mr-2 h-6 w-6" />
              {dia.nome}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default SalaDiasLancamento;

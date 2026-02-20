
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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

const DiasLancamento = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const serviceType = location.state?.serviceType;
  
  const titulo = serviceType === 'abrindo_horizontes' 
    ? 'Lançar Abrindo Horizontes' 
    : 'Lançar Produtividade de Sala';

  const handleDiaClick = (dia: string) => {
    console.log("Navegando para turmas do dia:", dia);
    navigate(`/turmas/dia`, { 
      state: { 
        dia,
        serviceType 
      }
    });
  };

  const handleVoltar = () => {
    navigate('/lancamentos');
  };

  return (
    <div className="container mx-auto p-4">
      <Button 
        onClick={handleVoltar} 
        variant="outline" 
        className="mb-4 dark:border-primary dark:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>
      
      <h1 className="text-2xl font-bold mb-6 text-roxo-DEFAULT dark:text-foreground">{titulo}</h1>
      
      <Card className="border-orange-200 bg-white dark:bg-card dark:border-border">
        <CardHeader className="border-b border-orange-100 dark:border-border">
          <CardTitle className="text-roxo-DEFAULT dark:text-foreground">Selecione o dia da semana</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 p-6">
          {diasSemana.map((dia) => (
            <Button 
              key={dia.id}
              size="lg"
              className={`py-8 text-lg ${
                serviceType === 'abrindo_horizontes' || serviceType === 'diario_turma'
                  ? 'border-orange-300 text-roxo-DEFAULT hover:bg-orange-100 dark:border-primary dark:text-foreground dark:hover:bg-primary/20'
                  : 'bg-supera hover:bg-supera-600 dark:bg-primary dark:hover:bg-primary/80'
              }`}
              variant={serviceType === 'abrindo_horizontes' || serviceType === 'diario_turma' ? 'outline' : 'default'}
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

export default DiasLancamento;

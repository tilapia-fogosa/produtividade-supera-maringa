import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, Calendar } from "lucide-react";

const AbrindoHorizontesSelecao = () => {
  const navigate = useNavigate();

  const handlePorTurma = () => {
    navigate('/dias-lancamento', { state: { serviceType: 'abrindo_horizontes' } });
  };

  const handlePorAluno = () => {
    navigate('/abrindo-horizontes/alunos');
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
      
      <h1 className="text-2xl font-bold mb-6 text-roxo-DEFAULT dark:text-foreground">
        Lançar Abrindo Horizontes
      </h1>
      
      <Card className="border-orange-200 bg-white dark:bg-card dark:border-border">
        <CardHeader className="border-b border-orange-100 dark:border-border">
          <CardTitle className="text-roxo-DEFAULT dark:text-foreground">
            Selecione o método de lançamento
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 p-6 max-w-md mx-auto">
          <Button 
            size="lg"
            className="py-8 text-lg border-orange-300 text-roxo-DEFAULT hover:bg-orange-100 dark:border-primary dark:text-foreground dark:hover:bg-primary/20"
            variant="outline"
            onClick={handlePorTurma}
          >
            <Calendar className="mr-2 h-6 w-6" />
            Por Turma
          </Button>

          <Button 
            size="lg"
            className="py-8 text-lg border-orange-300 text-roxo-DEFAULT hover:bg-orange-100 dark:border-primary dark:text-foreground dark:hover:bg-primary/20"
            variant="outline"
            onClick={handlePorAluno}
          >
            <Users className="mr-2 h-6 w-6" />
            Por Aluno
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AbrindoHorizontesSelecao;
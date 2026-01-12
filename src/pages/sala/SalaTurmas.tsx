
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useSalaTurmasPorDia } from '@/hooks/sala/use-sala-turmas-por-dia';
import SalaDayTurmasList from '@/components/sala/SalaDayTurmasList';

const diasNomes: Record<string, string> = {
  'segunda': 'Segunda-feira',
  'terca': 'Terça-feira',
  'quarta': 'Quarta-feira',
  'quinta': 'Quinta-feira',
  'sexta': 'Sexta-feira',
  'sabado': 'Sábado',
};

const SalaTurmas = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dia = location.state?.dia;
  const { turmas, loading } = useSalaTurmasPorDia(dia);

  const handleVoltar = () => {
    navigate('/sala/dias-lancamento');
  };

  const diaNome = dia ? diasNomes[dia] || dia : 'Dia não especificado';

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
        Turmas - {diaNome}
      </h1>
      
      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-foreground">Selecione a turma</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <SalaDayTurmasList 
            turmas={turmas}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SalaTurmas;


import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock } from "lucide-react";

interface Turma {
  id: string;
  nome: string;
  dia_semana: 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo';
  horario: string;
}

interface TurmasListProps {
  turmas: Turma[];
  onTurmaSelecionada: (turmaId: string) => void;
}

const diasSemanaFormatados: Record<string, string> = {
  'segunda': 'Segunda-feira',
  'terca': 'Terça-feira',
  'quarta': 'Quarta-feira',
  'quinta': 'Quinta-feira',
  'sexta': 'Sexta-feira',
  'sabado': 'Sábado',
  'domingo': 'Domingo'
};

const formatarHorario = (horario: string) => {
  return horario.substring(0, 5); // Retorna apenas HH:MM
};

const TurmasList: React.FC<TurmasListProps> = ({ turmas, onTurmaSelecionada }) => {
  return (
    <div className="grid gap-2">
      {turmas.map((turma) => (
        <Button
          key={turma.id}
          variant="outline"
          className="w-full justify-between text-left h-auto py-3 px-4"
          onClick={() => onTurmaSelecionada(turma.id)}
        >
          <div className="flex flex-col items-start">
            <span className="font-medium">{turma.nome}</span>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              <span>{diasSemanaFormatados[turma.dia_semana]}</span>
              <Clock className="h-3.5 w-3.5 ml-3 mr-1" />
              <span>{formatarHorario(turma.horario)}</span>
            </div>
          </div>
          <ArrowLeft className="h-4 w-4 rotate-180" />
        </Button>
      ))}
    </div>
  );
};

export default TurmasList;

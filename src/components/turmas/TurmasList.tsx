
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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

const diasSemanaAbreviados: Record<string, string> = {
  'segunda': 'Seg',
  'terca': 'Ter',
  'quarta': 'Qua',
  'quinta': 'Qui',
  'sexta': 'Sex',
  'sabado': 'Sáb',
  'domingo': 'Dom'
};

const TurmasList: React.FC<TurmasListProps> = ({ turmas, onTurmaSelecionada }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="grid gap-2">
      {turmas.map((turma) => (
        <Button
          key={turma.id}
          variant="outline"
          className={`w-full justify-between text-left h-auto ${isMobile ? "py-2 px-3" : "py-3 px-4"}`}
          onClick={() => onTurmaSelecionada(turma.id)}
        >
          <div className="flex flex-col items-start">
            <span className={`font-medium ${isMobile ? "text-sm" : ""}`}>{turma.nome}</span>
            <div className={`flex items-center text-muted-foreground mt-0.5 ${isMobile ? "text-xs" : "text-sm"}`}>
              <Calendar className={`${isMobile ? "h-3 w-3 mr-0.5" : "h-3.5 w-3.5 mr-1"}`} />
              <span>{isMobile ? diasSemanaAbreviados[turma.dia_semana] : diasSemanaFormatados[turma.dia_semana]}</span>
              <Clock className={`${isMobile ? "h-3 w-3 ml-2 mr-0.5" : "h-3.5 w-3.5 ml-3 mr-1"}`} />
              <span>{formatarHorario(turma.horario)}</span>
            </div>
          </div>
          <ArrowLeft className={`rotate-180 ${isMobile ? "h-3.5 w-3.5" : "h-4 w-4"}`} />
        </Button>
      ))}
    </div>
  );
};

export default TurmasList;

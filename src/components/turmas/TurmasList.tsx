
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const diasSemanaFormatados = {
  'segunda': 'Segunda-feira',
  'terca': 'Terça-feira',
  'quarta': 'Quarta-feira',
  'quinta': 'Quinta-feira',
  'sexta': 'Sexta-feira',
  'sabado': 'Sábado',
  'domingo': 'Domingo'
};

const formatarHorario = (horario: string) => {
  return horario.substring(0, 5);
};

const diasSemanaAbreviados = {
  'segunda': 'Seg',
  'terca': 'Ter',
  'quarta': 'Qua',
  'quinta': 'Qui',
  'sexta': 'Sex',
  'sabado': 'Sáb',
  'domingo': 'Dom'
};

const TurmasList: React.FC<{
  turmas: { 
    id: string; 
    nome: string; 
    dia_semana: 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo'; 
    horario: string 
  }[], 
  onTurmaSelecionada: (turmaId: string) => void
}> = ({ turmas, onTurmaSelecionada }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="p-2 bg-orange-50 rounded-lg">
      <h2 className="text-center font-bold mb-4 text-azul-500 border-b border-orange-200 pb-2">
        Turmas Disponíveis
      </h2>
      <div className="grid gap-3">
        {turmas.map((turma) => (
          <Button
            key={turma.id}
            variant="outline"
            className={`w-full justify-between text-left h-auto border-orange-200 hover:bg-orange-100 hover:border-orange-300 ${isMobile ? "py-3 px-3" : "py-3 px-4"}`}
            onClick={() => onTurmaSelecionada(turma.id)}
          >
            <div className="flex flex-col items-start">
              <span className={`font-medium text-azul-500 ${isMobile ? "text-sm" : ""}`}>{turma.nome}</span>
              <div className={`flex items-center text-azul-400 mt-1 ${isMobile ? "text-xs" : "text-sm"}`}>
                <Calendar className={`${isMobile ? "h-3 w-3 mr-0.5" : "h-3.5 w-3.5 mr-1"}`} />
                <span>{isMobile ? diasSemanaAbreviados[turma.dia_semana] : diasSemanaFormatados[turma.dia_semana]}</span>
                <Clock className={`${isMobile ? "h-3 w-3 ml-2 mr-0.5" : "h-3.5 w-3.5 ml-3 mr-1"}`} />
                <span>{formatarHorario(turma.horario)}</span>
              </div>
            </div>
            <ArrowLeft className={`rotate-180 text-azul-400 ${isMobile ? "h-3.5 w-3.5" : "h-4 w-4"}`} />
          </Button>
        ))}
      </div>
    </div>
  );
};

export default TurmasList;

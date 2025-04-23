import React from 'react';
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { Turma } from '@/hooks/use-turmas-por-dia';
import { useNavigate } from 'react-router-dom';

interface DayTurmasListProps {
  turmas: Turma[];
  loading: boolean;
  serviceType?: string;
}

const DayTurmasList: React.FC<DayTurmasListProps> = ({ 
  turmas, 
  loading,
  serviceType = 'produtividade'
}) => {
  const navigate = useNavigate();

  const handleTurmaClick = (turmaId: string) => {
    console.log("Clicou na turma:", turmaId, "Service type:", serviceType);
    
    if (serviceType === 'devolutiva') {
      navigate(`/devolutivas/turma/${turmaId}`);
    } else if (serviceType === 'abrindo_horizontes') {
      navigate(`/turma/${turmaId}/abrindo-horizontes`, { 
        state: { turmaId, serviceType }
      });
    } else if (serviceType === 'produtividade') {
      navigate(`/turma/${turmaId}/produtividade`, { 
        state: { turmaId, serviceType }
      });
    } else if (serviceType === 'diario') {
      navigate(`/turma/${turmaId}/diario`, {
        state: { turmaId, serviceType }
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <p>Carregando turmas...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {turmas.length === 0 ? (
        <p className="text-center text-gray-500">Nenhuma turma encontrada para este dia.</p>
      ) : (
        turmas.map((turma) => (
          <Button
            key={turma.id}
            variant="outline"
            className="w-full justify-between text-left h-auto border-orange-200 hover:bg-orange-100"
            onClick={() => handleTurmaClick(turma.id)}
          >
            <div className="flex flex-col items-start">
              <span className="font-medium text-azul-500">{turma.nome}</span>
              <div className="flex items-center text-azul-400 mt-1 text-sm">
                <Clock className="h-3.5 w-3.5 mr-1" />
                <span>{turma.horario.substring(0, 5)}</span>
              </div>
            </div>
          </Button>
        ))
      )}
    </div>
  );
};

export default DayTurmasList;

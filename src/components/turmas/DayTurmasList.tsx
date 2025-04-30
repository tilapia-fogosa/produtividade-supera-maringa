
import React from 'react';
import { Button } from "@/components/ui/button";
import { Turma } from '@/hooks/use-professor-turmas';
import { useNavigate, useLocation } from 'react-router-dom';

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
  const location = useLocation();
  const dia = location.state?.dia;

  const handleTurmaClick = (turmaId: string) => {
    if (serviceType === 'devolutiva') {
      navigate(`/devolutivas/turma/${turmaId}`);
    } else if (serviceType === 'abrindo_horizontes') {
      navigate(`/turma/${turmaId}/abrindo-horizontes`, { 
        state: { dia, serviceType }
      });
    } else {
      navigate(`/turma/${turmaId}/produtividade`, {
        state: { dia, serviceType }
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">Carregando turmas...</p>
      </div>
    );
  }

  // Ordenar turmas alfabeticamente pelo nome
  const turmasOrdenadas = [...turmas].sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <div className="grid grid-cols-1 gap-3">
      {turmasOrdenadas.length === 0 ? (
        <p className="text-center text-muted-foreground">Nenhuma turma encontrada para este dia.</p>
      ) : (
        turmasOrdenadas.map((turma) => (
          <Button
            key={turma.id}
            variant="outline"
            className="w-full justify-between text-left h-auto border-laranja-DEFAULT hover:bg-laranja-DEFAULT/10 dark:border-primary dark:hover:bg-primary/20"
            onClick={() => handleTurmaClick(turma.id)}
          >
            <div className="flex flex-col items-start">
              <span className="font-medium text-roxo-DEFAULT dark:text-primary">
                {turma.nome}
              </span>
            </div>
          </Button>
        ))
      )}
    </div>
  );
};

export default DayTurmasList;

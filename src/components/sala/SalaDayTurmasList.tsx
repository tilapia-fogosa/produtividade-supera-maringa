
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Turma } from '@/hooks/use-professor-turmas';

interface SalaDayTurmasListProps {
  turmas: Turma[];
  loading: boolean;
}

const SalaDayTurmasList: React.FC<SalaDayTurmasListProps> = ({
  turmas,
  loading
}) => {
  const navigate = useNavigate();

  const handleTurmaClick = (turmaId: string) => {
    navigate(`/sala/turma/${turmaId}/produtividade`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Carregando turmas...</p>
      </div>
    );
  }

  const turmasOrdenadas = [...turmas].sort((a, b) => 
    a.nome.localeCompare(b.nome)
  );

  if (turmasOrdenadas.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma turma encontrada para este dia.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {turmasOrdenadas.map((turma) => (
        <Button
          key={turma.id}
          variant="outline"
          className="w-full justify-start py-6 text-left border-border"
          onClick={() => handleTurmaClick(turma.id)}
        >
          <div>
            <p className="font-medium text-foreground">{turma.nome}</p>
            <p className="text-sm text-muted-foreground">
              {turma.dia_semana} • Sala {turma.sala || '-'}
            </p>
          </div>
        </Button>
      ))}
    </div>
  );
};

export default SalaDayTurmasList;

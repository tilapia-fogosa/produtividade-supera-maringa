
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { Turma } from '@/hooks/use-turmas-por-dia';

interface DayTurmasListProps {
  turmas: Turma[];
  loading: boolean;
}

const DayTurmasList: React.FC<DayTurmasListProps> = ({ turmas, loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="text-center p-4">
        <p>Carregando turmas...</p>
      </div>
    );
  }

  return (
    <Card className="border-orange-200">
      <CardContent className="p-4 space-y-4">
        {turmas.length === 0 ? (
          <p className="text-center text-gray-500">Nenhuma turma encontrada para este dia.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {turmas.map((turma) => (
              <Button
                key={turma.id}
                variant="outline"
                className="w-full justify-between text-left h-auto border-orange-200 hover:bg-orange-100"
                onClick={() => navigate(`/turma/${turma.id}`)}
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium text-azul-500">{turma.nome}</span>
                  <div className="flex items-center text-azul-400 mt-1 text-sm">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    <span>{turma.horario.substring(0, 5)}</span>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DayTurmasList;

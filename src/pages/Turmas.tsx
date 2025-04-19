
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTurmasPorDia } from '@/hooks/use-turmas-por-dia';
import ProfessorTurmas from '@/components/turmas/ProfessorTurmas';

const Turmas = () => {
  const navigate = useNavigate();
  const { turmas, loading, serviceType } = useTurmasPorDia();
  
  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-orange-950 dark:to-slate-950 text-azul-500 dark:text-orange-100">
        <div className="container mx-auto py-4 px-2 text-center">
          <p>Carregando turmas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-orange-950 dark:to-slate-950 text-azul-500 dark:text-orange-100">
      <ProfessorTurmas />
    </div>
  );
};

export default Turmas;

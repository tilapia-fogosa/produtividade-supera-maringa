
import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useProfessorTurmas } from '@/hooks/use-professor-turmas';
import { useAlunos } from '@/hooks/use-alunos';
import AbindoHorizontesScreen from '@/components/turmas/turma-detail/AbindoHorizontesScreen';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const AbrindoHorizontes = () => {
  const { turmaId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { turmas } = useProfessorTurmas();
  const { alunos } = useAlunos();
  
  const dia = location.state?.dia;
  const serviceType = location.state?.serviceType || 'abrindo_horizontes';
  
  const turma = turmas.find(t => t.id === turmaId);
  
  if (!turma) {
    return (
      <div className="container mx-auto py-4 px-2 text-center">
        <p>Turma não encontrada</p>
      </div>
    );
  }

  const handleVoltar = () => {
    navigate('/turmas/dia', { 
      state: { 
        dia,
        serviceType 
      }
    });
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-orange-950 dark:to-slate-950 text-azul-500 dark:text-orange-100">
      <div className="container mx-auto p-4">
        <AbindoHorizontesScreen 
          turma={turma}
          onBack={handleVoltar}
          alunos={alunos}
        />
      </div>
    </div>
  );
};

export default AbrindoHorizontes;

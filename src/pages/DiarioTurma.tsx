
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DiarioTurmaScreen from '@/components/turmas/turma-detail/DiarioTurmaScreen';
import { useProfessorTurmas } from '@/hooks/use-professor-turmas';
import { useAlunos } from '@/hooks/use-alunos';

const DiarioTurma = () => {
  const { turmaId } = useParams<{ turmaId: string }>();
  const navigate = useNavigate();
  const { turmas } = useProfessorTurmas();
  const { alunos } = useAlunos();
  
  const turma = turmas?.find(t => t.id === turmaId);
  
  if (!turma) {
    return <div>Turma não encontrada</div>;
  }

  return (
    <div className="container mx-auto py-4 px-2 text-azul-500">
      <DiarioTurmaScreen 
        turma={turma}
        alunos={alunos}
        onBack={() => navigate(-1)}
      />
    </div>
  );
};

export default DiarioTurma;

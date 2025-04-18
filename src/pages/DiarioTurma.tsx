
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DiarioTurmaScreen from '@/components/turmas/turma-detail/DiarioTurmaScreen';
import { useProfessorTurmas } from '@/hooks/use-professor-turmas';
import { useAlunos } from '@/hooks/use-alunos';

const DiarioTurma = () => {
  const { turmaId } = useParams<{ turmaId: string }>();
  const navigate = useNavigate();
  const { turmas } = useProfessorTurmas();
  const { alunos } = useAlunos();
  
  useEffect(() => {
    console.log('Página DiarioTurma carregada com turmaId:', turmaId);
    console.log('Turmas disponíveis:', turmas);
  }, [turmaId, turmas]);
  
  const turma = turmas?.find(t => t.id === turmaId);
  
  if (!turma) {
    return (
      <div className="container mx-auto py-4 px-2 text-center">
        <p className="text-azul-500 font-medium">Turma não encontrada. ID: {turmaId}</p>
        <Button className="mt-4" onClick={() => navigate('/')}>Voltar para Home</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-2 text-azul-500">
      <DiarioTurmaScreen 
        turma={turma}
        alunos={alunos?.filter(a => a.turma_id === turmaId) || []}
        onBack={() => navigate(-1)}
      />
    </div>
  );
};

export default DiarioTurma;

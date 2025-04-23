
import React from 'react';
import { useLocation } from 'react-router-dom';
import ProdutividadeScreen from '@/components/turmas/turma-detail/ProdutividadeScreen';
import AbindoHorizontesScreen from '@/components/turmas/turma-detail/AbindoHorizontesScreen';
import { useProfessorTurmas } from '@/hooks/use-professor-turmas';
import { useAlunos } from '@/hooks/use-alunos';

const DiarioTurma = () => {
  const location = useLocation();
  const serviceType = location.state?.serviceType || 'produtividade';
  
  const { turmas } = useProfessorTurmas();
  const {
    alunos,
    todosAlunos,
    turmaSelecionada,
    produtividadeRegistrada,
    handleRegistrarPresenca,
    voltarParaTurmas,
  } = useAlunos();

  if (!turmaSelecionada) {
    return (
      <div className="container mx-auto py-4 px-2 text-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-2">
      {serviceType === 'abrindo_horizontes' ? (
        <AbindoHorizontesScreen
          turma={turmaSelecionada}
          alunos={alunos}
          onBack={voltarParaTurmas}
        />
      ) : (
        <ProdutividadeScreen
          turma={turmaSelecionada}
          alunos={alunos}
          onBack={voltarParaTurmas}
          onRegistrarPresenca={handleRegistrarPresenca}
          produtividadeRegistrada={produtividadeRegistrada}
        />
      )}
    </div>
  );
};

export default DiarioTurma;

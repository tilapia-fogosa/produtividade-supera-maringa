
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

  // Verificamos se não temos uma turma selecionada e mostramos um estado de carregamento
  if (!turmaSelecionada) {
    return (
      <div className="container mx-auto py-4 px-2 text-center">
        <p>Carregando...</p>
      </div>
    );
  }

  // Encontramos o objeto da turma selecionada para passar para os componentes
  // Adaptação para usar o valor de turmaSelecionada para encontrar o objeto da turma
  // ou usar um objeto com os valores mínimos necessários
  const turmaAtual = {
    id: turmaSelecionada,
    nome: 'Turma', // Valor padrão
    dia_semana: 'segunda',
    horario: '00:00',
    professor_id: '',
  };

  // Função adaptada para receber um objeto Aluno e extrair o ID
  const handleRegistrarPresencaAdapter = (aluno) => {
    return handleRegistrarPresenca(aluno.id);
  };

  return (
    <div className="container mx-auto py-4 px-2">
      {serviceType === 'abrindo_horizontes' ? (
        <AbindoHorizontesScreen
          turma={turmaAtual}
          alunos={alunos}
          onBack={voltarParaTurmas}
        />
      ) : (
        <ProdutividadeScreen
          turma={turmaAtual}
          alunos={alunos}
          onBack={voltarParaTurmas}
          onRegistrarPresenca={handleRegistrarPresencaAdapter}
          produtividadeRegistrada={produtividadeRegistrada}
        />
      )}
    </div>
  );
};

export default DiarioTurma;

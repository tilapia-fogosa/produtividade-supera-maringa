
import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import ProdutividadeScreen from '@/components/turmas/turma-detail/ProdutividadeScreen';
import AbindoHorizontesScreen from '@/components/turmas/turma-detail/AbindoHorizontesScreen';
import { useProfessorTurmas } from '@/hooks/use-professor-turmas';
import { useAlunos } from '@/hooks/use-alunos';
import { Turma } from '@/hooks/use-turmas-por-dia';

const DiarioTurma = () => {
  const location = useLocation();
  const params = useParams();
  
  // Usar o ID da turma do parâmetro da URL ou do state
  const turmaIdFromParams = params.turmaId;
  const turmaIdFromState = location.state?.turmaSelecionada;
  const turmaSelecionada = turmaIdFromParams || turmaIdFromState;
  
  // Garantir que serviceType tenha um valor padrão
  const serviceType = location.state?.serviceType || 'produtividade';

  console.log("DiarioTurma - ID da turma:", turmaSelecionada);
  console.log("DiarioTurma - Service Type:", serviceType);
  
  const { turmas } = useProfessorTurmas();
  const {
    alunos,
    todosAlunos,
    turmaSelecionada: turmaNoHook,
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

  // Encontramos o objeto da turma selecionada
  // Adaptação para usar o valor de turmaSelecionada para encontrar o objeto da turma
  // ou usar um objeto com os valores mínimos necessários
  const turmaAtual: Turma = {
    id: turmaSelecionada,
    nome: 'Turma', // Valor padrão
    dia_semana: 'segunda', // Usando type assertion para garantir o tipo correto
    horario: '00:00',
    professor_id: '',
  };

  // Função adaptada para receber um objeto Aluno e extrair o ID
  const handleRegistrarPresencaAdapter = (aluno: any) => {
    return handleRegistrarPresenca(aluno.id);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-orange-950 dark:to-slate-950 text-azul-500 dark:text-orange-100">
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
    </div>
  );
};

export default DiarioTurma;

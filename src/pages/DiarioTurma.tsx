
import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import ProdutividadeScreen from '@/components/turmas/turma-detail/ProdutividadeScreen';
import AbindoHorizontesScreen from '@/components/turmas/turma-detail/AbindoHorizontesScreen';
import DiarioTurmaScreen from '@/components/turmas/turma-detail/DiarioTurmaScreen';
import { useProfessorTurmas } from '@/hooks/use-professor-turmas';
import { useAlunos } from '@/hooks/use-alunos';
import { Turma } from '@/hooks/use-turmas-por-dia';
import { useNavigate } from 'react-router-dom';

const DiarioTurma = () => {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  
  // Usar o ID da turma do parâmetro da URL
  const turmaId = params.turmaId;
  
  // Garantir que serviceType tenha um valor padrão
  const serviceType = location.state?.serviceType || 'produtividade';

  console.log("DiarioTurma - ID da turma:", turmaId);
  console.log("DiarioTurma - Service Type:", serviceType);
  
  const { turmas } = useProfessorTurmas();
  const { alunos, handleRegistrarPresenca, produtividadeRegistrada } = useAlunos();

  // Função para voltar para a página anterior
  const voltarParaTurmas = () => {
    navigate(-1); // Volta para a página anterior usando o histórico do navegador
  };

  // Verificamos se não temos uma turma selecionada e mostramos um estado de carregamento
  if (!turmaId) {
    return (
      <div className="container mx-auto py-4 px-2 text-center">
        <p>Carregando...</p>
      </div>
    );
  }

  // Criamos um objeto de turma básico com o ID fornecido
  const turmaAtual: Turma = {
    id: turmaId,
    nome: 'Turma', // Valor padrão
    dia_semana: 'segunda', // Usando type assertion para garantir o tipo correto
    horario: '00:00',
    professor_id: '',
  };

  // Função adaptada para receber um objeto Aluno e extrair o ID
  const handleRegistrarPresencaAdapter = (aluno: any) => {
    return handleRegistrarPresenca(aluno.id);
  };

  // Renderiza a tela apropriada com base no serviceType
  const renderScreen = () => {
    if (serviceType === 'abrindo_horizontes') {
      return (
        <AbindoHorizontesScreen
          turma={turmaAtual}
          alunos={alunos}
          onBack={voltarParaTurmas}
        />
      );
    } else if (serviceType === 'diario') {
      return (
        <DiarioTurmaScreen
          turma={turmaAtual}
          alunos={alunos}
          onBack={voltarParaTurmas}
        />
      );
    } else {
      // Padrão: produtividade
      return (
        <ProdutividadeScreen
          turma={turmaAtual}
          alunos={alunos}
          onBack={voltarParaTurmas}
          onRegistrarPresenca={handleRegistrarPresencaAdapter}
          produtividadeRegistrada={produtividadeRegistrada}
        />
      );
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-orange-950 dark:to-slate-950 text-azul-500 dark:text-orange-100">
      <div className="container mx-auto py-4 px-2">
        {renderScreen()}
      </div>
    </div>
  );
};

export default DiarioTurma;


import React from 'react';
import { useLocation } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import ProfessorHeader from './ProfessorHeader';
import ProfessorConteudo from './ProfessorConteudo';
import { useProfessorTurmas, Aluno as ProfessorAluno } from '@/hooks/use-professor-turmas';
import { useAlunos } from '@/hooks/use-alunos';

const ProfessorTurmas = () => {
  const { professor, turmas, loading, navigate } = useProfessorTurmas();
  const location = useLocation();
  const initialServiceType = location.state?.serviceType === 'abrindo_horizontes' ? 'abrindo_horizontes' : 'produtividade';

  const {
    alunos,
    todosAlunos,
    turmaSelecionada,
    alunoDetalhes,
    carregandoAlunos,
    produtividadeRegistrada,
    handleTurmaSelecionada,
    handleRegistrarPresenca,
    mostrarDetalhesAluno,
    fecharDetalhesAluno,
    voltarParaTurmas,
    atualizarProdutividadeRegistrada
  } = useAlunos();

  const handleVoltar = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-4 px-2 text-center text-azul-500">
        <p>Carregando...</p>
      </div>
    );
  }

  // Usamos casting de tipo para resolver o problema de compatibilidade entre 
  // os tipos de Aluno do hook useAlunos e do hook useProfessorTurmas
  return (
    <div className="container mx-auto py-4 px-2 md:py-8 md:px-4">
      <ProfessorHeader 
        professor={professor} 
        turmas={turmas} 
        onVoltar={handleVoltar} 
      />

      <Card className="border-orange-200 bg-white mt-2 md:mt-4 w-full overflow-hidden">
        <ProfessorConteudo 
          turmas={turmas}
          turmaSelecionada={turmaSelecionada}
          alunos={alunos as ProfessorAluno[]}
          todosAlunos={todosAlunos as ProfessorAluno[]}
          alunoDetalhes={alunoDetalhes as ProfessorAluno}
          produtividadeRegistrada={produtividadeRegistrada}
          onTurmaSelecionada={handleTurmaSelecionada}
          onRegistrarPresenca={handleRegistrarPresenca}
          onShowAlunoDetails={mostrarDetalhesAluno as (aluno: ProfessorAluno) => void}
          onVoltarParaTurmas={voltarParaTurmas}
          onFecharDetalhesAluno={fecharDetalhesAluno}
          initialServiceType={initialServiceType}
        />
      </Card>
    </div>
  );
};

export default ProfessorTurmas;

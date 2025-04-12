
import React from 'react';
import { Card } from "@/components/ui/card";
import ProfessorHeader from './ProfessorHeader';
import ProfessorConteudo from './ProfessorConteudo';
import { useProfessorTurmas } from '@/hooks/use-professor-turmas';
import { useAlunos } from '@/hooks/use-alunos';

interface ProfessorTurmasProps {
  initialServiceType?: string;
}

const ProfessorTurmas: React.FC<ProfessorTurmasProps> = ({ initialServiceType = 'produtividade' }) => {
  const { professor, turmas, loading, navigate } = useProfessorTurmas();
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
      <div className="container mx-auto py-4 px-2 text-center text-orange-800">
        <p>Carregando...</p>
      </div>
    );
  }

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
          alunos={alunos}
          todosAlunos={todosAlunos}
          alunoDetalhes={alunoDetalhes}
          produtividadeRegistrada={produtividadeRegistrada}
          onTurmaSelecionada={handleTurmaSelecionada}
          onRegistrarPresenca={handleRegistrarPresenca}
          onShowAlunoDetails={mostrarDetalhesAluno}
          onVoltarParaTurmas={voltarParaTurmas}
          onFecharDetalhesAluno={fecharDetalhesAluno}
          initialServiceType={initialServiceType}
        />
      </Card>
    </div>
  );
};

export default ProfessorTurmas;

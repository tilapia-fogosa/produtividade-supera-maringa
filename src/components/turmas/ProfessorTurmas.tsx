
import React from 'react';
import { Card } from "@/components/ui/card";
import ProfessorHeader from './ProfessorHeader';
import ProfessorConteudo from './ProfessorConteudo';
import { useProfessorTurmas } from '@/hooks/use-professor-turmas';
import { useAlunos } from '@/hooks/use-alunos';

const ProfessorTurmas = () => {
  const { professor, turmas, loading, navigate } = useProfessorTurmas();
  const {
    alunos,
    todosAlunos,
    turmaSelecionada,
    alunoDetalhes,
    carregandoAlunos,
    handleTurmaSelecionada,
    handleRegistrarPresenca,
    mostrarDetalhesAluno,
    fecharDetalhesAluno,
    voltarParaTurmas
  } = useAlunos();

  const handleVoltar = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <ProfessorHeader 
        professor={professor} 
        turmas={turmas} 
        onVoltar={handleVoltar} 
      />

      <Card>
        <ProfessorConteudo 
          turmas={turmas}
          turmaSelecionada={turmaSelecionada}
          alunos={alunos}
          todosAlunos={todosAlunos}
          alunoDetalhes={alunoDetalhes}
          onTurmaSelecionada={handleTurmaSelecionada}
          onRegistrarPresenca={handleRegistrarPresenca}
          onShowAlunoDetails={mostrarDetalhesAluno}
          onVoltarParaTurmas={voltarParaTurmas}
          onFecharDetalhesAluno={fecharDetalhesAluno}
        />
      </Card>
    </div>
  );
};

export default ProfessorTurmas;

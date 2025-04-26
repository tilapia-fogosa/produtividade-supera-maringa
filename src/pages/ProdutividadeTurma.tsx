
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useProfessorTurmas } from '@/hooks/use-professor-turmas';
import { useAlunos } from '@/hooks/use-alunos';
import ProdutividadeModal from '@/components/turmas/ProdutividadeModal';
import ProdutividadeScreen from '@/components/turmas/turma-detail/ProdutividadeScreen';
import ReposicaoAulaModal from '@/components/turmas/ReposicaoAulaModal';

const ProdutividadeTurma = () => {
  const { turmaId } = useParams<{ turmaId: string }>();
  const navigate = useNavigate();
  const { getTurma } = useProfessorTurmas();
  const { 
    alunos,
    todosAlunos,
    carregandoAlunos,
    produtividadeRegistrada,
    handleTurmaSelecionada,
    handleRegistrarPresenca,
    atualizarProdutividadeRegistrada
  } = useAlunos();

  const [mostrandoReposicao, setMostrandoReposicao] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<string | null>(null);
  
  const turma = getTurma(turmaId || '');
  
  React.useEffect(() => {
    if (turmaId) {
      handleTurmaSelecionada(turmaId);
    }
  }, [turmaId, handleTurmaSelecionada]);

  const handleVoltarParaTurmas = () => {
    navigate('/turmas/dia');
  };
  
  const handleRegistrarPresencaAluno = (alunoId: string) => {
    setAlunoSelecionado(alunoId);
  };
  
  const handleFecharModal = () => {
    setAlunoSelecionado(null);
  };
  
  const handleRegistrarPresencaCompleto = () => {
    if (alunoSelecionado) {
      atualizarProdutividadeRegistrada(alunoSelecionado);
    }
    setAlunoSelecionado(null);
  };
  
  const handleAbrirReposicaoModal = () => {
    setMostrandoReposicao(true);
  };
  
  const handleFecharReposicaoModal = () => {
    setMostrandoReposicao(false);
  };
  
  if (!turma) {
    return (
      <div className="container mx-auto p-4">
        <Button variant="outline" onClick={handleVoltarParaTurmas}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <div className="mt-8 text-center">
          <p>Turma não encontrada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <ProdutividadeScreen
        turma={turma}
        onBack={handleVoltarParaTurmas}
        alunos={alunos}
        onRegistrarPresenca={handleRegistrarPresencaAluno}
        onReposicaoAula={handleAbrirReposicaoModal}
        produtividadeRegistrada={produtividadeRegistrada}
      />
      
      {alunoSelecionado && (
        <ProdutividadeModal
          turmaId={turmaId || ''}
          alunoId={alunoSelecionado}
          onClose={handleFecharModal}
          onRegister={handleRegistrarPresencaCompleto}
        />
      )}

      {mostrandoReposicao && turma && (
        <ReposicaoAulaModal
          isOpen={true}
          turma={turma}
          todosAlunos={todosAlunos}
          onClose={handleFecharReposicaoModal}
        />
      )}
    </div>
  );
};

export default ProdutividadeTurma;


import React, { useState } from 'react';
import { Aluno, Turma } from '@/hooks/use-professor-turmas';
import { TelaModo } from './turma-detail/types';
import TurmaHeader from './turma-detail/TurmaHeader';
import ConfigErrorMessage from './turma-detail/ConfigErrorMessage';
import ProdutividadeScreen from './turma-detail/ProdutividadeScreen';
import AbindoHorizontesScreen from './turma-detail/AbindoHorizontesScreen';
import ProdutividadeModal from './ProdutividadeModal';
import ReposicaoAulaModal from './ReposicaoAulaModal';
import { useIsMobile } from "@/hooks/use-mobile";

interface TurmaDetailProps {
  turma: Turma;
  alunos: Aluno[];
  todosAlunos: Aluno[];
  onVoltar: () => void;
  onShowAlunoDetails: (aluno: Aluno) => void;
  onRegistrarPresenca: (alunoId: string) => void;
  produtividadeRegistrada?: Record<string, boolean>;
  initialServiceType?: string;
}

const TurmaDetail: React.FC<TurmaDetailProps> = ({
  turma,
  alunos,
  todosAlunos,
  onVoltar,
  onShowAlunoDetails,
  onRegistrarPresenca,
  produtividadeRegistrada = {},
  initialServiceType = 'produtividade'
}) => {
  const isMobile = useIsMobile();
  
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [reposicaoModalAberto, setReposicaoModalAberto] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  
  const [telaModo, setTelaModo] = useState<TelaModo>(
    initialServiceType === 'abrindo_horizontes' ? TelaModo.AH : TelaModo.LISTA_ALUNOS
  );
  
  const handleBackNavigation = () => {
    onVoltar();
  };

  const handleClickRegistrarPresenca = (aluno: Aluno) => {
    setAlunoSelecionado(aluno);
    setModalAberto(true);
  };
  
  const handleFecharModal = () => {
    setModalAberto(false);
    setAlunoSelecionado(null);
  };
  
  const handleClickReposicaoAula = () => {
    setReposicaoModalAberto(true);
  };
  
  const handleFecharReposicaoModal = () => {
    setReposicaoModalAberto(false);
  };

  const handleModalError = (errorMessage: string) => {
    if (errorMessage.includes("credenciais do Google") || 
        errorMessage.includes("Google Service Account")) {
      setConfigError("Configuração incompleta: O administrador precisa configurar as credenciais do Google Service Account");
    }
  };
  
  return (
    <div className="w-full px-1 text-azul-500">
      <TurmaHeader 
        turmaNome={turma.nome}
        telaModo={telaModo}
        onBack={handleBackNavigation}
      />

      <ConfigErrorMessage errorMessage={configError} />

      <div className={isMobile ? "mt-2" : "mt-4"}>
        {telaModo === TelaModo.LISTA_ALUNOS && (
          <ProdutividadeScreen 
            alunos={alunos}
            onRegistrarPresenca={handleClickRegistrarPresenca}
            onReposicaoAula={handleClickReposicaoAula}
            produtividadeRegistrada={produtividadeRegistrada}
          />
        )}
        
        {telaModo === TelaModo.AH && (
          <AbindoHorizontesScreen 
            onBackToMenu={handleBackNavigation}
            alunos={alunos} // Passando os alunos como props
          />
        )}
      </div>

      {/* Modals */}
      {alunoSelecionado && (
        <ProdutividadeModal 
          isOpen={modalAberto} 
          aluno={alunoSelecionado} 
          turma={turma} 
          onClose={handleFecharModal} 
          onSuccess={alunoId => {
            if (produtividadeRegistrada && alunoId) {
              produtividadeRegistrada[alunoId] = true;
            }
          }}
          onError={handleModalError} 
        />
      )}

      <ReposicaoAulaModal 
        isOpen={reposicaoModalAberto} 
        turma={turma} 
        todosAlunos={todosAlunos} 
        onClose={handleFecharReposicaoModal}
        onError={handleModalError} 
      />
    </div>
  );
};

export default TurmaDetail;

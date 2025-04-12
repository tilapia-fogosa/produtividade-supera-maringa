
import React, { useState } from 'react';
import { Aluno, Turma } from '@/hooks/use-professor-turmas';
import { TelaModo } from './turma-detail/types';
import TurmaHeader from './turma-detail/TurmaHeader';
import ConfigErrorMessage from './turma-detail/ConfigErrorMessage';
import ServiceSelectionMenu from './turma-detail/ServiceSelectionMenu';
import ProdutividadeScreen from './turma-detail/ProdutividadeScreen';
import AbindoHorizontesScreen from './turma-detail/AbindoHorizontesScreen';
import ProdutividadeModal from './ProdutividadeModal';
import ReposicaoAulaModal from './ReposicaoAulaModal';

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
  // State for modals and errors
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [reposicaoModalAberto, setReposicaoModalAberto] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  
  // Set initial telaModo based on initialServiceType
  const getInitialTelaModo = () => {
    if (initialServiceType === 'produtividade') {
      return TelaModo.LISTA_ALUNOS;
    } else if (initialServiceType === 'abrindo_horizontes') {
      return TelaModo.AH;
    }
    return TelaModo.MENU_INICIAL;
  };
  
  // Screen mode state
  const [telaModo, setTelaModo] = useState<TelaModo>(getInitialTelaModo());
  
  // Handler functions
  const handleBackNavigation = () => {
    if (telaModo === TelaModo.MENU_INICIAL) {
      onVoltar();
    } else {
      setTelaModo(TelaModo.MENU_INICIAL);
    }
  };

  const handleSelectService = (service: 'lista_alunos' | 'ah') => {
    setTelaModo(service === 'lista_alunos' ? TelaModo.LISTA_ALUNOS : TelaModo.AH);
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
    // Check if the error is related to Google credentials
    if (errorMessage.includes("credenciais do Google") || 
        errorMessage.includes("Google Service Account")) {
      setConfigError("Configuração incompleta: O administrador precisa configurar as credenciais do Google Service Account");
    }
  };
  
  return (
    <div>
      <TurmaHeader 
        turmaNome={turma.nome}
        telaModo={telaModo}
        onBack={handleBackNavigation}
      />

      <ConfigErrorMessage errorMessage={configError} />

      {/* Render content based on current screen mode */}
      {telaModo === TelaModo.MENU_INICIAL && (
        <ServiceSelectionMenu onSelectService={handleSelectService} />
      )}
      
      {telaModo === TelaModo.LISTA_ALUNOS && (
        <ProdutividadeScreen 
          alunos={alunos}
          onRegistrarPresenca={handleClickRegistrarPresenca}
          onReposicaoAula={handleClickReposicaoAula}
          produtividadeRegistrada={produtividadeRegistrada}
        />
      )}
      
      {telaModo === TelaModo.AH && (
        <AbindoHorizontesScreen onBackToMenu={() => setTelaModo(TelaModo.MENU_INICIAL)} />
      )}

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

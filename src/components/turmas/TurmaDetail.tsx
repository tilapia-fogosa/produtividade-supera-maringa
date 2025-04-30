
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Turma } from '@/hooks/use-professor-turmas';
import { PessoaTurma } from '@/hooks/use-pessoas-turma';
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
  alunos: PessoaTurma[];
  todosAlunos: PessoaTurma[];
  onVoltar: () => void;
  onShowAlunoDetails: (aluno: PessoaTurma) => void;
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
  
  const [alunoSelecionado, setAlunoSelecionado] = useState<PessoaTurma | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [reposicaoModalAberto, setReposicaoModalAberto] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  
  // Convertendo o valor de string para o enum TelaModo
  const telaInicial = initialServiceType === 'abrindo_horizontes' ? 'AH' : 'LISTA_ALUNOS';
  const [telaModo, setTelaModo] = useState<'LISTA_ALUNOS' | 'AH'>(telaInicial);
  
  const handleBackNavigation = () => {
    onVoltar();
  };

  const handleClickRegistrarPresenca = (aluno: PessoaTurma) => {
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
        turma={turma}
        telaModo={telaModo}
        onBack={handleBackNavigation}
      />

      <ConfigErrorMessage errorMessage={configError} />

      <div className={isMobile ? "mt-2" : "mt-4"}>
        {telaModo === 'LISTA_ALUNOS' && (
          <ProdutividadeScreen 
            turma={turma}
            onBack={() => {}} // Não usado, mas necessário para tipagem
            alunos={alunos}
            onRegistrarPresenca={handleClickRegistrarPresenca}
            onReposicaoAula={handleClickReposicaoAula}
            produtividadeRegistrada={produtividadeRegistrada}
          />
        )}
        
        {telaModo === 'AH' && (
          <AbindoHorizontesScreen 
            turma={turma}
            onBack={() => {}} // Não usado, mas necessário para tipagem
            alunos={alunos}
            onBackToMenu={handleBackNavigation}
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


import React from 'react';
import { Button } from "@/components/ui/button";
import { Aluno, Turma } from '@/hooks/use-professor-turmas';
import ReposicaoButton from './ReposicaoButton';
import AlunosListaTable from './AlunosListaTable';
import { useNavigate, useParams } from 'react-router-dom';
import TurmaHeader from './TurmaHeader';

interface ProdutividadeScreenProps {
  turma: Turma;
  onBack: () => void;
  alunos?: Aluno[];
  onRegistrarPresenca?: (alunoId: string) => void;
  onReposicaoAula?: () => void;
  produtividadeRegistrada?: Record<string, boolean>;
}

const ProdutividadeScreen: React.FC<ProdutividadeScreenProps> = ({
  turma,
  onBack,
  alunos = [],
  onRegistrarPresenca = () => {},
  onReposicaoAula = () => {},
  produtividadeRegistrada = {}
}) => {
  const navigate = useNavigate();
  const { turmaId } = useParams();

  const verDiario = () => {
    console.log('Navegando para o diário da turma:', turmaId);
    navigate(`/turma/${turmaId}/diario`, {
      state: { turmaId, serviceType: 'diario' }
    });
  };

  return (
    <>
      <TurmaHeader
        turma={turma}
        onBack={onBack}
      />
      <div className="flex justify-between items-center mb-3">
        <ReposicaoButton onClick={onReposicaoAula} />
        <Button 
          variant="outline"
          onClick={verDiario}
          className="ml-2"
        >
          Ver Diário
        </Button>
      </div>
      
      <AlunosListaTable 
        alunos={alunos}
        onRegistrarPresenca={onRegistrarPresenca}
        produtividadeRegistrada={produtividadeRegistrada}
      />
    </>
  );
};

export default ProdutividadeScreen;

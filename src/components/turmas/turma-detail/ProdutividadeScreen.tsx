
import React from 'react';
import { Button } from "@/components/ui/button";
import { Aluno, Turma } from '@/hooks/use-professor-turmas';
import ReposicaoButton from './ReposicaoButton';
import AlunosListaTable from './AlunosListaTable';
import { useNavigate } from 'react-router-dom';

interface ProdutividadeScreenProps {
  turma: Turma;
  onBack: () => void;
  alunos?: Aluno[];
  onRegistrarPresenca?: (aluno: Aluno) => void;
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

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <ReposicaoButton onClick={onReposicaoAula} />
        <Button 
          variant="outline"
          onClick={() => {
            console.log('Navegando para o diário');
            navigate('/diario');
          }}
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

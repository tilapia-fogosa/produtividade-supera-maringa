
import React from 'react';
import { Aluno } from '@/hooks/use-professor-turmas';
import ReposicaoButton from './ReposicaoButton';
import AlunosListaTable from './AlunosListaTable';
import { useIsMobile } from "@/hooks/use-mobile";

interface ProdutividadeScreenProps {
  alunos: Aluno[];
  onRegistrarPresenca: (aluno: Aluno) => void;
  onReposicaoAula: () => void;
  produtividadeRegistrada: Record<string, boolean>;
}

const ProdutividadeScreen: React.FC<ProdutividadeScreenProps> = ({
  alunos,
  onRegistrarPresenca,
  onReposicaoAula,
  produtividadeRegistrada
}) => {
  const isMobile = useIsMobile();
  
  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <ReposicaoButton onClick={onReposicaoAula} />
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

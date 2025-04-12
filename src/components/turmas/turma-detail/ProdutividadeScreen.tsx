
import React from 'react';
import { Aluno } from '@/hooks/use-professor-turmas';
import ReposicaoButton from './ReposicaoButton';
import AlunosListaTable from './AlunosListaTable';

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
  return (
    <>
      <ReposicaoButton onClick={onReposicaoAula} />
      <AlunosListaTable 
        alunos={alunos}
        onRegistrarPresenca={onRegistrarPresenca}
        produtividadeRegistrada={produtividadeRegistrada}
      />
    </>
  );
};

export default ProdutividadeScreen;


import React from 'react';
import { Aluno } from '@/hooks/use-professor-turmas';
import ReposicaoButton from './ReposicaoButton';
import AlunosListaTable from './AlunosListaTable';
import { TelaModo } from './types';
import { Button } from "@/components/ui/button";
import { Book } from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";

interface ProdutividadeScreenProps {
  alunos: Aluno[];
  onRegistrarPresenca: (aluno: Aluno) => void;
  onReposicaoAula: () => void;
  produtividadeRegistrada: Record<string, boolean>;
  onModeChange?: (mode: TelaModo) => void;
}

const ProdutividadeScreen: React.FC<ProdutividadeScreenProps> = ({
  alunos,
  onRegistrarPresenca,
  onReposicaoAula,
  produtividadeRegistrada,
  onModeChange
}) => {
  const isMobile = useIsMobile();
  
  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <ReposicaoButton onClick={onReposicaoAula} />
        
        {isMobile && onModeChange && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onModeChange(TelaModo.AH)}
            className="border-orange-200 text-azul-500"
          >
            <Book className="h-4 w-4 mr-1" />
            Abrindo Horizontes
          </Button>
        )}
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

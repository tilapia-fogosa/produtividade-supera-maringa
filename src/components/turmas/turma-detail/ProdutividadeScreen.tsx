
import React from 'react';
import { Aluno, Turma } from '@/hooks/use-professor-turmas';
import ReposicaoButton from './ReposicaoButton';
import AlunosListaTable from './AlunosListaTable';
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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
  const isMobile = useIsMobile();
  
  return (
    <>
      <div className="border-b border-orange-100 pb-2 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="mr-2 text-azul-400 hover:text-azul-500 hover:bg-orange-50"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
            
            <div>
              <h2 className={`font-bold text-azul-500 ${isMobile ? "text-lg" : "text-xl"}`}>
                {turma.nome}
              </h2>
              <p className="text-sm text-azul-400">Produtividade de Sala</p>
            </div>
          </div>
        </div>
      </div>

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

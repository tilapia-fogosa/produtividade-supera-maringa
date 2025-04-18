
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Aluno, Turma } from '@/hooks/use-professor-turmas';
import { useIsMobile } from "@/hooks/use-mobile";
import AlunosAHTable from './AlunosAHTable';

interface AbindoHorizontesScreenProps {
  turma: Turma;
  onBack: () => void;
  alunos?: Aluno[];
  onBackToMenu?: () => void;
}

const AbindoHorizontesScreen: React.FC<AbindoHorizontesScreenProps> = ({ 
  turma,
  onBack,
  alunos = [],
  onBackToMenu = () => {}
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
              <p className="text-sm text-azul-400">Abrindo Horizontes</p>
            </div>
          </div>
        </div>
      </div>
      
      <AlunosAHTable alunos={alunos} />
    </>
  );
};

export default AbindoHorizontesScreen;

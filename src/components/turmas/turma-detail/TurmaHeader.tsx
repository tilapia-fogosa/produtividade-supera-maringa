
import React from 'react';
import { TelaModo } from './types';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Book, List } from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";

interface TurmaHeaderProps {
  turmaNome: string;
  telaModo: TelaModo;
  onBack: () => void;
  onModeChange?: (mode: TelaModo) => void;
}

const TurmaHeader: React.FC<TurmaHeaderProps> = ({ 
  turmaNome, 
  telaModo,
  onBack,
  onModeChange
}) => {
  const isMobile = useIsMobile();

  return (
    <div className="border-b border-orange-100 pb-2 mb-2">
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
          
          <h1 className={`font-bold text-azul-500 ${isMobile ? "text-lg" : "text-xl"}`}>
            {turmaNome}
          </h1>
        </div>
        
        {onModeChange && (
          <div className="flex space-x-1">
            <Button
              variant={telaModo === TelaModo.LISTA_ALUNOS ? "default" : "outline"}
              size="sm"
              onClick={() => onModeChange(TelaModo.LISTA_ALUNOS)}
              className={`${telaModo === TelaModo.LISTA_ALUNOS ? "bg-supera text-white" : "border-orange-200 text-azul-500"}`}
            >
              <List className="h-4 w-4 mr-1" />
              {!isMobile && "Produtividade"}
            </Button>
            
            <Button
              variant={telaModo === TelaModo.AH ? "default" : "outline"}
              size="sm"
              onClick={() => onModeChange(TelaModo.AH)}
              className={`${telaModo === TelaModo.AH ? "bg-supera text-white" : "border-orange-200 text-azul-500"}`}
            >
              <Book className="h-4 w-4 mr-1" />
              {!isMobile && "Abrindo Horizontes"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TurmaHeader;

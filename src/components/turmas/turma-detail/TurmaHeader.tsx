
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";

interface TurmaHeaderProps {
  turmaNome: string;
  onBack: () => void;
  telaModo?: 'LISTA_ALUNOS' | 'AH';
}

const TurmaHeader: React.FC<TurmaHeaderProps> = ({ 
  turmaNome, 
  telaModo = 'LISTA_ALUNOS',
  onBack
}) => {
  const isMobile = useIsMobile();
  
  const getHeaderText = () => {
    return telaModo === 'LISTA_ALUNOS' 
      ? "Produtividade de Sala" 
      : "Abrindo Horizontes";
  };

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
          
          <div>
            <h2 className={`font-bold text-azul-500 ${isMobile ? "text-lg" : "text-xl"}`}>
              {turmaNome}
            </h2>
            <p className="text-sm text-azul-400">{getHeaderText()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurmaHeader;

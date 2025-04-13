
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { TelaModo } from "./types";

interface TurmaHeaderProps {
  turmaNome: string;
  telaModo: TelaModo;
  onBack: () => void;
}

const TurmaHeader: React.FC<TurmaHeaderProps> = ({ turmaNome, telaModo, onBack }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex justify-between items-center mb-3">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onBack} 
        className="px-2 py-1 h-8 text-azul-500 border-orange-200"
      >
        <ArrowLeft className="mr-1 h-3.5 w-3.5" /> 
        <span className={isMobile ? "text-xs" : ""}>
          {telaModo === TelaModo.MENU_INICIAL ? "Voltar" : "Menu"}
        </span>
      </Button>
      <div className={`font-medium text-azul-500 ${isMobile ? "text-sm ml-1" : "text-lg"}`}>
        {turmaNome}
      </div>
    </div>
  );
};

export default TurmaHeader;

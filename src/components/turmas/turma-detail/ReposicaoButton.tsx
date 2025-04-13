
import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ReposicaoButtonProps {
  onClick: () => void;
}

const ReposicaoButton: React.FC<ReposicaoButtonProps> = ({ onClick }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="mb-3">
      <Button variant="outline" size={isMobile ? "sm" : "default"} onClick={onClick} className="w-full text-azul-500 border-orange-200 hover:bg-orange-100">
        <RefreshCw className={`mr-1.5 ${isMobile ? "h-3.5 w-3.5" : "h-4 w-4"}`} />
        <span className={isMobile ? "text-xs" : ""}>Registrar Reposição de Aula</span>
      </Button>
    </div>
  );
};

export default ReposicaoButton;

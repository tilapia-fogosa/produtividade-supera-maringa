
import React from 'react';
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface AbindoHorizontesScreenProps {
  onBackToMenu: () => void;
}

const AbindoHorizontesScreen: React.FC<AbindoHorizontesScreenProps> = ({ onBackToMenu }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="text-center py-6">
      <h2 className={`font-semibold mb-4 ${isMobile ? "text-lg" : "text-xl"}`}>
        Lançamento de Abrindo Horizontes
      </h2>
      <p className={`mb-6 ${isMobile ? "text-sm" : ""}`}>
        Funcionalidade em desenvolvimento
      </p>
      <Button 
        onClick={onBackToMenu}
        size={isMobile ? "sm" : "default"}
      >
        Voltar para o Menu
      </Button>
    </div>
  );
};

export default AbindoHorizontesScreen;

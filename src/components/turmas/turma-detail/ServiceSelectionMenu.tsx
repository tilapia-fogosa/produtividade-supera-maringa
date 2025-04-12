
import React from 'react';
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface ServiceSelectionMenuProps {
  onSelectService: (service: 'lista_alunos' | 'ah') => void;
}

const ServiceSelectionMenu: React.FC<ServiceSelectionMenuProps> = ({ onSelectService }) => {
  const isMobile = useIsMobile();

  return (
    <div className={`flex flex-col space-y-4 ${isMobile ? "px-4" : "px-0"}`}>
      <Button 
        variant="outline" 
        onClick={() => onSelectService('lista_alunos')} 
        className={`w-full ${isMobile ? "text-sm py-2" : ""}`}
      >
        Registrar Produtividade
      </Button>
      <Button 
        variant="outline" 
        onClick={() => onSelectService('ah')} 
        className={`w-full ${isMobile ? "text-sm py-2" : ""}`}
      >
        Lançamento Abrindo Horizontes
      </Button>
    </div>
  );
};

export default ServiceSelectionMenu;

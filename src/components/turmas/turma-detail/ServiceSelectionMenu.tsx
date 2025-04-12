
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ServiceSelectionMenuProps {
  onSelectService: (service: 'lista_alunos' | 'ah') => void;
}

const ServiceSelectionMenu: React.FC<ServiceSelectionMenuProps> = ({ onSelectService }) => {
  const isMobile = useIsMobile();
  
  return (
    <Card className="w-full">
      <CardHeader className={isMobile ? "px-4 py-3" : ""}>
        <CardTitle className={`text-center ${isMobile ? "text-lg" : ""}`}>Selecione o serviço</CardTitle>
      </CardHeader>
      <CardContent className={`flex flex-col space-y-4 ${isMobile ? "px-4 py-3" : ""}`}>
        <Button 
          size="lg" 
          className={`text-lg ${isMobile ? "py-6" : "py-8"}`}
          onClick={() => onSelectService('lista_alunos')}
        >
          <Users className={`mr-2 ${isMobile ? "h-5 w-5" : "h-6 w-6"}`} />
          <span className={isMobile ? "text-base" : "text-lg"}>Lançar Produtividade de Sala</span>
        </Button>
        <Button 
          size="lg" 
          className={`text-lg ${isMobile ? "py-6" : "py-8"}`}
          onClick={() => onSelectService('ah')}
          variant="outline"
        >
          <BookOpen className={`mr-2 ${isMobile ? "h-5 w-5" : "h-6 w-6"}`} />
          <span className={isMobile ? "text-base" : "text-lg"}>Lançar Abrindo Horizontes</span>
        </Button>
      </CardContent>
    </Card>
  );
};

export default ServiceSelectionMenu;

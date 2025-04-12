
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users } from "lucide-react";

interface ServiceSelectionMenuProps {
  onSelectService: (service: 'lista_alunos' | 'ah') => void;
}

const ServiceSelectionMenu: React.FC<ServiceSelectionMenuProps> = ({ onSelectService }) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center">Selecione o serviço</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col space-y-4">
        <Button 
          size="lg" 
          className="py-8 text-lg"
          onClick={() => onSelectService('lista_alunos')}
        >
          <Users className="mr-2 h-6 w-6" />
          Lançar Produtividade de Sala
        </Button>
        <Button 
          size="lg" 
          className="py-8 text-lg"
          onClick={() => onSelectService('ah')}
          variant="outline"
        >
          <BookOpen className="mr-2 h-6 w-6" />
          Lançar Abrindo Horizontes
        </Button>
      </CardContent>
    </Card>
  );
};

export default ServiceSelectionMenu;

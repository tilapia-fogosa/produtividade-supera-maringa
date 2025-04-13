
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Professor, Turma } from '@/hooks/use-professor-turmas';
import { useIsMobile } from "@/hooks/use-mobile";

interface ProfessorHeaderProps {
  professor: Professor | null;
  turmas: Turma[];
  onVoltar: () => void;
}

const ProfessorHeader: React.FC<ProfessorHeaderProps> = ({ professor, turmas, onVoltar }) => {
  const isMobile = useIsMobile();
  
  return (
    <>
      <Button 
        onClick={onVoltar} 
        variant="outline" 
        className={`mb-4 text-azul-500 border-orange-200 ${isMobile ? "text-xs h-8 px-3" : ""}`}
      >
        <ArrowLeft className={`mr-2 ${isMobile ? "h-3.5 w-3.5" : "h-4 w-4"}`} /> Voltar
      </Button>

      <CardHeader className={`pb-3 ${isMobile ? "p-4" : "p-6"}`}>
        <CardTitle className={`${isMobile ? "text-lg" : "text-xl"} text-azul-500`}>
          {professor?.nome}
        </CardTitle>
        <CardDescription className={`${isMobile ? "text-xs" : ""} text-azul-400`}>
          {turmas.length} turma{turmas.length !== 1 ? 's' : ''} encontrada{turmas.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
    </>
  );
};

export default ProfessorHeader;

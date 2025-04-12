
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Professor, Turma } from '@/hooks/use-professor-turmas';

interface ProfessorHeaderProps {
  professor: Professor | null;
  turmas: Turma[];
  onVoltar: () => void;
}

const ProfessorHeader: React.FC<ProfessorHeaderProps> = ({ professor, turmas, onVoltar }) => {
  return (
    <>
      <Button 
        onClick={onVoltar} 
        variant="outline" 
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>

      <CardHeader className="pb-3">
        <CardTitle className="text-xl">{professor?.nome}</CardTitle>
        <CardDescription>
          {turmas.length} turma{turmas.length !== 1 ? 's' : ''} encontrada{turmas.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
    </>
  );
};

export default ProfessorHeader;

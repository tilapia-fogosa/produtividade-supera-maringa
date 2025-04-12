
import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TrendingUp, CheckCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { Aluno } from '@/hooks/use-professor-turmas';

interface AlunosListaTableProps {
  alunos: Aluno[];
  onRegistrarPresenca: (aluno: Aluno) => void;
  produtividadeRegistrada: Record<string, boolean>;
}

const AlunosListaTable: React.FC<AlunosListaTableProps> = ({ 
  alunos, 
  onRegistrarPresenca, 
  produtividadeRegistrada
}) => {
  const isMobile = useIsMobile();

  if (alunos.length === 0) {
    return (
      <div className="text-center py-3">
        <p className={isMobile ? "text-sm" : ""}>Não há alunos cadastrados nesta turma.</p>
      </div>
    );
  }

  return (
    <div className={`w-full ${isMobile ? "-mx-2" : ""}`}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className={`w-1/3 ${isMobile ? "px-2 py-2 text-xs" : ""}`}>Nome</TableHead>
            <TableHead className={`w-1/3 ${isMobile ? "px-2 py-2 text-xs" : ""}`}>Último Nível</TableHead>
            <TableHead className={`w-1/3 text-center ${isMobile ? "px-2 py-2 text-xs" : ""}`}>Produtividade</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alunos.map((aluno, index) => (
            <TableRow key={aluno.id} className={index % 2 === 1 ? "bg-muted/50" : ""}>
              <TableCell className={`w-1/3 font-medium truncate ${isMobile ? "px-2 py-1.5 text-xs" : ""}`}>
                {aluno.nome}
              </TableCell>
              <TableCell className={`w-1/3 ${isMobile ? "px-2 py-1.5 text-xs" : ""}`}>
                {aluno.ultimo_nivel || '-'}
              </TableCell>
              <TableCell className={`w-1/3 text-center ${isMobile ? "px-2 py-1.5" : ""}`}>
                <div className="flex items-center justify-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => onRegistrarPresenca(aluno)} 
                          className={`${isMobile ? "h-7 w-7 p-0" : "h-8 px-2"} flex items-center justify-center`}
                        >
                          {produtividadeRegistrada[aluno.id] && (
                            <CheckCircle className={`text-green-500 ${isMobile ? "h-3.5 w-3.5" : "h-4 w-4"}`} />
                          )}
                          <TrendingUp className={isMobile ? "h-3.5 w-3.5" : "h-4 w-4"} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {produtividadeRegistrada[aluno.id] ? "Produtividade já registrada hoje" : "Registrar produtividade"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AlunosListaTable;


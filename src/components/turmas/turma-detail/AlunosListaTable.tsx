
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
    <div className={isMobile ? "-mx-2" : ""}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className={isMobile ? "px-2 py-2 text-xs" : ""}>Nome</TableHead>
            <TableHead className={`${isMobile ? "px-2 py-2 text-xs" : ""}`}>Último Nível</TableHead>
            <TableHead className={`w-[100px] ${isMobile ? "px-2 py-2 text-xs" : ""}`}>Produtividade</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alunos.map((aluno, index) => (
            <TableRow key={aluno.id} className={index % 2 === 1 ? "bg-muted/50" : ""}>
              <TableCell className={`font-medium ${isMobile ? "px-2 py-1.5 text-xs truncate max-w-[120px]" : ""}`}>
                {aluno.nome}
              </TableCell>
              <TableCell className={`${isMobile ? "px-2 py-1.5 text-xs" : ""}`}>
                {aluno.ultimo_nivel || '-'}
              </TableCell>
              <TableCell className={isMobile ? "px-2 py-1.5" : ""}>
                <div className="flex items-center justify-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => onRegistrarPresenca(aluno)} 
                          className={isMobile ? "h-7 w-7 p-0" : "h-8 px-2"}
                        >
                          {produtividadeRegistrada[aluno.id] && <CheckCircle className={`mr-1 text-green-500 ${isMobile ? "h-3.5 w-3.5" : "h-4 w-4"}`} />}
                          <TrendingUp className={isMobile ? "h-3.5 w-3.5" : "h-4 w-4"} />
                          {!isMobile && <span className="ml-1 text-xs">Lançar</span>}
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

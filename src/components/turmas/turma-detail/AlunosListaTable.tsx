
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
    <div className="overflow-x-auto -mx-1">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className={`${isMobile ? "px-2 py-2 text-xs" : ""}`}>Nome</TableHead>
            <TableHead className={`${isMobile ? "px-2 py-2 text-xs" : ""}`}>Último Nível</TableHead>
            <TableHead className={`w-20 text-right ${isMobile ? "px-2 py-2 text-xs" : ""}`}>Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alunos.map((aluno, index) => (
            <TableRow key={aluno.id} className={index % 2 === 1 ? "bg-muted/50" : ""}>
              <TableCell className={`font-medium ${isMobile ? "px-2 py-1.5 text-xs" : ""}`}>
                <div className="truncate max-w-[120px]">{aluno.nome}</div>
              </TableCell>
              <TableCell className={`${isMobile ? "px-2 py-1.5 text-xs" : ""}`}>
                {aluno.ultimo_nivel || '-'}
              </TableCell>
              <TableCell className={`text-right ${isMobile ? "px-2 py-1.5" : ""}`}>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => onRegistrarPresenca(aluno)} 
                        className="h-8 w-8 p-0"
                      >
                        {produtividadeRegistrada[aluno.id] ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingUp className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {produtividadeRegistrada[aluno.id] ? "Produtividade já registrada hoje" : "Registrar produtividade"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AlunosListaTable;


import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { PessoaTurmaDetalhes } from '@/hooks/use-turma-detalhes';
import { formatDateBr } from "@/lib/utils";

interface AlunosAHTableProps {
  alunos: PessoaTurmaDetalhes[];
  onSelecionarAluno?: (pessoa: PessoaTurmaDetalhes) => void;
  ahRegistrado?: Record<string, boolean>;
}

const AlunosAHTable: React.FC<AlunosAHTableProps> = ({ 
  alunos, 
  onSelecionarAluno = () => {}, 
  ahRegistrado = {}
}) => {
  const isMobile = useIsMobile();
  
  // Filtrar apenas as pessoas ativas
  const pessoasAtivas = alunos.filter(pessoa => pessoa.active);

  if (pessoasAtivas.length === 0) {
    return (
      <div className="text-center py-3">
        <p className={isMobile ? "text-sm" : ""}>Não há pessoas cadastradas nesta turma.</p>
      </div>
    );
  }

  // Função para formatar a data da última correção AH
  const formatarUltimaCorrecao = (dataCorrecao: string | null) => {
    if (!dataCorrecao) return '-';
    return formatDateBr(new Date(dataCorrecao));
  };

  return (
    <div className="overflow-x-auto w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className={`${isMobile ? "px-2 py-2 text-xs" : ""}`}>Nome</TableHead>
            <TableHead className={`${isMobile ? "px-2 py-2 text-xs" : ""}`}>Tipo</TableHead>
            <TableHead className={`${isMobile ? "px-2 py-2 text-xs" : ""}`}>Última Correção</TableHead>
            <TableHead className={`w-20 text-right ${isMobile ? "px-2 py-2 text-xs" : ""}`}>Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pessoasAtivas.map((pessoa, index) => (
            <TableRow key={pessoa.id} className={index % 2 === 1 ? "bg-muted/50" : ""}>
              <TableCell className={`font-medium ${isMobile ? "px-2 py-1.5 text-xs" : ""}`}>
                <div className="truncate max-w-[150px]">{pessoa.nome}</div>
              </TableCell>
              <TableCell className={`${isMobile ? "px-2 py-1.5 text-xs" : ""}`}>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  pessoa.origem === 'aluno' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {pessoa.origem === 'aluno' ? 'Aluno' : 'Funcionário'}
                </span>
              </TableCell>
              <TableCell className={`${isMobile ? "px-2 py-1.5 text-xs" : ""}`}>
                {formatarUltimaCorrecao(pessoa.ultima_correcao_ah)}
              </TableCell>
              <TableCell className={`text-right ${isMobile ? "px-2 py-1.5" : ""}`}>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => onSelecionarAluno(pessoa)} 
                        className="h-8 w-8 p-0"
                      >
                        {ahRegistrado[pessoa.id] ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <BookOpen className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {ahRegistrado[pessoa.id] ? "Correção AH já registrada hoje" : "Registrar correção AH"}
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

export default AlunosAHTable;

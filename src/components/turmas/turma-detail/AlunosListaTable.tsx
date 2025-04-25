
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Aluno } from '@/hooks/use-professor-turmas';

interface AlunosListaTableProps {
  alunos: Aluno[];
  onRegistrarPresenca?: (aluno: Aluno) => void;
  produtividadeRegistrada?: Record<string, boolean>;
}

const AlunosListaTable: React.FC<AlunosListaTableProps> = ({
  alunos = [],
  onRegistrarPresenca,
  produtividadeRegistrada = {}
}) => {
  // Filtrar apenas os alunos ativos para garantir
  const alunosAtivos = alunos.filter(aluno => aluno.active);

  if (alunosAtivos.length === 0) {
    return <p className="text-center my-4">Nenhum aluno encontrado nesta turma.</p>;
  }

  return (
    <div className="rounded-md border border-orange-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-orange-50">
            <TableHead className="w-[200px] font-medium">Nome</TableHead>
            <TableHead className="text-right font-medium">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alunosAtivos.map((aluno) => (
            <TableRow key={aluno.id} className="even:bg-orange-50/50">
              <TableCell className="font-medium">{aluno.nome}</TableCell>
              <TableCell className="text-right">
                {produtividadeRegistrada[aluno.id] ? (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 text-green-600"
                    disabled
                  >
                    <Check className="mr-1 h-4 w-4" />
                    Registrado
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 border-orange-200 hover:bg-orange-100"
                    onClick={() => onRegistrarPresenca && onRegistrarPresenca(aluno)}
                  >
                    Registrar
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AlunosListaTable;

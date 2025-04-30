
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PessoaTurma } from '@/hooks/use-pessoas-turma';
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface AlunosListaTableProps {
  alunos: PessoaTurma[];
  onRegistrarPresenca: (aluno: PessoaTurma) => void;
  produtividadeRegistrada?: Record<string, boolean>;
}

const AlunosListaTable: React.FC<AlunosListaTableProps> = ({
  alunos,
  onRegistrarPresenca,
  produtividadeRegistrada = {}
}) => {
  if (alunos.length === 0) {
    return (
      <div className="text-center py-8 bg-slate-50 rounded-md">
        <p className="text-gray-500">Nenhuma pessoa encontrada nesta turma</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Último registro</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alunos.map((aluno) => (
            <TableRow key={aluno.id}>
              <TableCell className="font-medium">
                {aluno.nome}
              </TableCell>
              <TableCell>
                <Badge variant={aluno.origem === 'funcionario' ? "secondary" : "default"}>
                  {aluno.origem === 'funcionario' ? 'Funcionário' : 'Aluno'}
                </Badge>
              </TableCell>
              <TableCell>
                {aluno.ultima_pagina ? (
                  <span>
                    {aluno.ultima_pagina} 
                    {aluno.ultimo_nivel ? ` (${aluno.ultimo_nivel})` : ''}
                  </span>
                ) : (
                  <span className="text-gray-400">Sem registro</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {produtividadeRegistrada[aluno.id] ? (
                  <Button 
                    variant="ghost" 
                    className="text-green-600 hover:text-green-700 cursor-default"
                    disabled
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Registrado
                  </Button>
                ) : (
                  <Button 
                    onClick={() => onRegistrarPresenca(aluno)}
                    variant="outline" 
                    className="hover:bg-orange-100"
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

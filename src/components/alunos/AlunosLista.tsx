
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
import { Eye } from "lucide-react";
import { Aluno } from '@/hooks/use-alunos';

interface AlunosListaProps {
  alunos: Aluno[];
  onAlunoClick: (aluno: Aluno) => void;
}

export function AlunosLista({ alunos, onAlunoClick }: AlunosListaProps) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Data Onboarding</TableHead>
            <TableHead>Coordenador</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alunos.map((aluno) => (
            <TableRow key={aluno.id}>
              <TableCell>{aluno.nome}</TableCell>
              <TableCell>
                {aluno.data_onboarding 
                  ? new Date(aluno.data_onboarding).toLocaleDateString() 
                  : 'Não realizado'}
              </TableCell>
              <TableCell>{aluno.coordenador_responsavel || '-'}</TableCell>
              <TableCell>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => onAlunoClick(aluno)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

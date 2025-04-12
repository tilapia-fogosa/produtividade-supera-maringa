
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info, Pencil } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

interface Turma {
  id: string;
  nome: string;
  dia_semana: 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo';
  horario: string;
}

interface Aluno {
  id: string;
  nome: string;
  turma_id: string;
  codigo?: string | null;
  telefone?: string | null;
  email?: string | null;
  curso?: string | null;
  matricula?: string | null;
  idade?: number | null;
  ultimo_nivel?: string | null;
  dias_apostila?: number | null;
  dias_supera?: number | null;
  vencimento_contrato?: string | null;
}

interface TurmaDetailProps {
  turma: Turma;
  alunos: Aluno[];
  onVoltar: () => void;
  onShowAlunoDetails: (aluno: Aluno) => void;
  onRegistrarPresenca: (alunoId: string) => void;
}

const TurmaDetail: React.FC<TurmaDetailProps> = ({ 
  turma, 
  alunos, 
  onVoltar, 
  onShowAlunoDetails, 
  onRegistrarPresenca 
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onVoltar}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para turmas
        </Button>
        <div className="text-lg font-medium">
          {turma.nome}
        </div>
      </div>

      {alunos.length === 0 ? (
        <div className="text-center py-4">
          <p>Não há alunos cadastrados nesta turma.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Aluno</TableHead>
              <TableHead className="hidden md:table-cell">Código</TableHead>
              <TableHead className="hidden md:table-cell">Último Nível</TableHead>
              <TableHead className="w-[120px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alunos.map((aluno, index) => (
              <TableRow key={aluno.id} className={index % 2 === 1 ? "bg-muted/50" : ""}>
                <TableCell className="font-medium">{aluno.nome}</TableCell>
                <TableCell className="hidden md:table-cell">{aluno.codigo || '-'}</TableCell>
                <TableCell className="hidden md:table-cell">{aluno.ultimo_nivel || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onShowAlunoDetails(aluno)}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onRegistrarPresenca(aluno.id)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default TurmaDetail;

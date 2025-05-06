
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
import { Check, Trash2 } from "lucide-react";
import { format } from 'date-fns';

interface AlunosListaTableProps {
  alunos: PessoaTurma[];
  onRegistrarPresenca: (aluno: PessoaTurma) => void;
  onExcluirRegistro?: (aluno: PessoaTurma) => void;
  produtividadeRegistrada?: Record<string, boolean>;
}

const AlunosListaTable: React.FC<AlunosListaTableProps> = ({
  alunos,
  onRegistrarPresenca,
  onExcluirRegistro,
  produtividadeRegistrada = {}
}) => {
  if (alunos.length === 0) {
    return (
      <div className="text-center py-8 bg-slate-50 rounded-md">
        <p className="text-gray-500">Nenhuma pessoa encontrada nesta turma</p>
      </div>
    );
  }

  const formatarData = (dataString?: string) => {
    if (!dataString) return '-';
    
    try {
      // Verifica o formato da data (ISO ou apenas data)
      const data = dataString.includes('T') 
        ? new Date(dataString) 
        : new Date(`${dataString}T00:00:00`);
      
      // Se a data for válida, formata para DD/MM/YYYY
      if (!isNaN(data.getTime())) {
        return format(data, 'dd/MM/yyyy');
      }
      return dataString; // Retorna a string original se não conseguir converter
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return dataString; // Retorna a string original em caso de erro
    }
  };

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Último registro</TableHead>
            <TableHead>Último lançamento</TableHead>
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
              <TableCell>
                {aluno.data_ultimo_registro ? (
                  <span>{formatarData(aluno.data_ultimo_registro)}</span>
                ) : (
                  <span className="text-gray-400">Nunca</span>
                )}
              </TableCell>
              <TableCell className="text-right flex justify-end items-center gap-2">
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
                
                {aluno.ultimo_registro_id && onExcluirRegistro && (
                  <Button 
                    onClick={() => onExcluirRegistro(aluno)}
                    variant="ghost" 
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
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

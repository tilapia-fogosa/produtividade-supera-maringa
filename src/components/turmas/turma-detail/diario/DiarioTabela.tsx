
import React from 'react';
import { Check, Edit, Trash2, X } from "lucide-react";
import { Aluno } from '@/hooks/use-professor-turmas';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface RegistroProdutividade {
  id: string;
  aluno_id: string;
  data_aula: string;
  presente: boolean;
  is_reposicao: boolean;
  apostila: string;
  pagina: string;
  exercicios: number;
  erros: number;
  fez_desafio: boolean;
  comentario: string;
  created_at: string;
  updated_at: string;
  nivel_desafio?: number;
}

interface DiarioTabelaProps {
  alunosFiltrados: Aluno[];
  registros: Record<string, RegistroProdutividade>;
  carregando: boolean;
  onEditClick: (registro: RegistroProdutividade, aluno: Aluno) => void;
  onDeleteClick: (registro: RegistroProdutividade, aluno: Aluno) => void;
}

const DiarioTabela: React.FC<DiarioTabelaProps> = ({
  alunosFiltrados,
  registros,
  carregando,
  onEditClick,
  onDeleteClick
}) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Aluno</TableHead>
            <TableHead>Presença</TableHead>
            <TableHead>Apostila</TableHead>
            <TableHead>Página</TableHead>
            <TableHead>Exercícios</TableHead>
            <TableHead>Erros</TableHead>
            <TableHead>Desafio</TableHead>
            <TableHead>Nível</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alunosFiltrados.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center">
                {carregando ? "Carregando..." : "Nenhum aluno encontrado"}
              </TableCell>
            </TableRow>
          ) : (
            alunosFiltrados.map((aluno) => {
              const registro = registros[aluno.id];
              return (
                <TableRow key={aluno.id}>
                  <TableCell className="font-medium">{aluno.nome}</TableCell>
                  <TableCell>
                    {registro ? (
                      registro.presente ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Check className="h-4 w-4 text-green-500" />
                            </TooltipTrigger>
                            <TooltipContent>Presente</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <X className="h-4 w-4 text-red-500" />
                            </TooltipTrigger>
                            <TooltipContent>Ausente</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )
                    ) : ("-")}
                  </TableCell>
                  <TableCell>{registro?.apostila || "-"}</TableCell>
                  <TableCell>{registro?.pagina || "-"}</TableCell>
                  <TableCell>{registro?.exercicios || "-"}</TableCell>
                  <TableCell>{registro?.erros || "-"}</TableCell>
                  <TableCell>
                    {registro ? (
                      registro.fez_desafio ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Check className="h-4 w-4 text-green-500" />
                            </TooltipTrigger>
                            <TooltipContent>Fez o desafio</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <X className="h-4 w-4 text-red-500" />
                            </TooltipTrigger>
                            <TooltipContent>Não fez desafio</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )
                    ) : ("-")}
                  </TableCell>
                  <TableCell>{aluno.niveldesafio || "-"}</TableCell>
                  <TableCell>
                    {registro ? (
                      <div className="flex space-x-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => onEditClick(registro, aluno)}
                              >
                                <Edit className="h-4 w-4 text-blue-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar registro</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => onDeleteClick(registro, aluno)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Excluir registro</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default DiarioTabela;

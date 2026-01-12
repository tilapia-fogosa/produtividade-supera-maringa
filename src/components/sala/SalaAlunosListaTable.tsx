
import React from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Check, Trash2 } from "lucide-react";
import { SalaPessoaTurma } from '@/hooks/sala/use-sala-pessoas-turma';

interface SalaAlunosListaTableProps {
  alunos: SalaPessoaTurma[];
  onRegistrarPresenca: (aluno: SalaPessoaTurma) => void;
  onExcluirRegistro?: (aluno: SalaPessoaTurma) => void;
  produtividadeRegistrada?: Record<string, boolean>;
}

const SalaAlunosListaTable: React.FC<SalaAlunosListaTableProps> = ({
  alunos,
  onRegistrarPresenca,
  onExcluirRegistro,
  produtividadeRegistrada = {}
}) => {
  if (alunos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum aluno encontrado nesta turma.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alunos.map((aluno) => {
        const jaRegistrou = aluno.produtividadeRegistrada || produtividadeRegistrada[aluno.id];
        
        return (
          <div
            key={aluno.id}
            className={`flex items-center justify-between p-4 rounded-lg border ${
              jaRegistrou 
                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                : 'bg-card border-border'
            }`}
          >
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="h-10 w-10">
                <AvatarImage src={aluno.foto_url || undefined} alt={aluno.nome} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {aluno.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-foreground">{aluno.nome}</p>
                {aluno.origem === 'funcionario' && (
                  <span className="text-xs text-muted-foreground">(Funcionário)</span>
                )}
                {aluno.ultima_pagina && (
                  <p className="text-sm text-muted-foreground">
                    Página: {aluno.ultima_pagina}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              {jaRegistrou ? (
                <>
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <Check className="h-5 w-5" />
                    <span className="text-sm font-medium">Registrado</span>
                  </div>
                  {onExcluirRegistro && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onExcluirRegistro(aluno)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  onClick={() => onRegistrarPresenca(aluno)}
                  className="bg-primary hover:bg-primary/90"
                >
                  Registrar
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SalaAlunosListaTable;

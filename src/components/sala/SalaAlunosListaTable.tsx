
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Check, Trash2, X } from "lucide-react";
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
  const [fotoAmpliada, setFotoAmpliada] = useState<{ url: string; nome: string } | null>(null);

  if (alunos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum aluno encontrado nesta turma.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {alunos.map((aluno) => {
          const jaRegistrou = aluno.produtividadeRegistrada || produtividadeRegistrada[aluno.id];
          
          return (
            <div
              key={aluno.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                jaRegistrou 
                  ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                  : 'bg-card border-border'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <Avatar 
                  className="h-20 w-20 shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                  onClick={() => {
                    if (aluno.foto_url) {
                      setFotoAmpliada({ url: aluno.foto_url, nome: aluno.nome });
                    }
                  }}
                >
                  <AvatarImage 
                    src={aluno.foto_url || undefined} 
                    alt={aluno.nome}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
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

      {/* Lightbox Fullscreen */}
      <Dialog open={!!fotoAmpliada} onOpenChange={() => setFotoAmpliada(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/90 border-none flex items-center justify-center">
          <button
            onClick={() => setFotoAmpliada(null)}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          {fotoAmpliada && (
            <div className="flex flex-col items-center gap-4 p-4">
              <img
                src={fotoAmpliada.url}
                alt={fotoAmpliada.nome}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
              <p className="text-white text-lg font-medium">{fotoAmpliada.nome}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SalaAlunosListaTable;

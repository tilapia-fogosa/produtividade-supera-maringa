
import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Check, Trash2, X, BookOpen, FileText, Target, AlertTriangle, Cake, Shirt, BookMarked, RefreshCw } from "lucide-react";
import { SalaPessoaTurma } from '@/hooks/sala/use-sala-pessoas-turma';
import { useApostilas } from '@/hooks/use-apostilas';
import { LembretesAluno } from '@/hooks/sala/use-lembretes-alunos';
import { ReposicaoHoje } from '@/hooks/sala/use-reposicoes-hoje';

interface SalaAlunosListaTableProps {
  alunos: SalaPessoaTurma[];
  onRegistrarPresenca: (aluno: SalaPessoaTurma, presente: boolean) => void;
  onExcluirRegistro?: (aluno: SalaPessoaTurma) => void;
  produtividadeRegistrada?: Record<string, boolean>;
  lembretes?: Record<string, LembretesAluno>;
  reposicoesHoje?: ReposicaoHoje[];
}

// Tipo estendido para incluir dados de reposição
interface AlunoComReposicao extends SalaPessoaTurma {
  isReposicao?: boolean;
  turmaOriginalNome?: string;
}

const SalaAlunosListaTable: React.FC<SalaAlunosListaTableProps> = ({
  alunos,
  onRegistrarPresenca,
  onExcluirRegistro,
  produtividadeRegistrada = {},
  lembretes = {},
  reposicoesHoje = []
}) => {
  const [fotoAmpliada, setFotoAmpliada] = useState<{ url: string; nome: string } | null>(null);
  const { getTotalPaginas } = useApostilas();

  // Converter reposições em formato compatível com SalaPessoaTurma
  const alunosReposicao: AlunoComReposicao[] = useMemo(() => {
    // Filtrar reposições que não são alunos já da turma
    const idsAlunosTurma = new Set(alunos.map(a => a.id));
    
    return reposicoesHoje
      .filter(r => !idsAlunosTurma.has(r.pessoa_id))
      .map(r => ({
        id: r.pessoa_id,
        nome: r.pessoa_nome,
        turma_id: r.turma_original_id || null,
        origem: r.pessoa_tipo as 'aluno' | 'funcionario',
        foto_url: r.foto_url || null,
        ultima_pagina: r.ultima_pagina || null,
        ultimo_nivel: r.ultimo_nivel || null,
        niveldesafio: r.niveldesafio || null,
        faltas_consecutivas: r.faltas_consecutivas || 0,
        produtividadeRegistrada: false,
        isReposicao: true,
        turmaOriginalNome: r.turma_original_nome
      }));
  }, [reposicoesHoje, alunos]);

  // Combinar alunos da turma + reposições
  const todosAlunos = useMemo(() => [...alunos, ...alunosReposicao], [alunos, alunosReposicao]);

  if (todosAlunos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum aluno encontrado nesta turma.
      </div>
    );
  }

  // Componente para renderizar um card de aluno
  const renderAlunoCard = (aluno: AlunoComReposicao, isReposicao: boolean = false) => {
    const jaRegistrou = aluno.produtividadeRegistrada || produtividadeRegistrada[aluno.id];
    const totalPaginas = getTotalPaginas(aluno.ultimo_nivel);
    const paginasRestantes = aluno.ultima_pagina ? totalPaginas - aluno.ultima_pagina : null;
    const temFaltasConsecutivas = aluno.faltas_consecutivas && aluno.faltas_consecutivas > 0;
    const alunoLembretes = lembretes[aluno.id];
    const temLembretes = alunoLembretes && (
      alunoLembretes.aniversarioHoje || 
      alunoLembretes.camisetaPendente || 
      alunoLembretes.apostilaAHPronta
    );
  
    return (
      <div
        key={aluno.id}
        className={`flex items-center justify-between p-3 rounded-lg border ${
          jaRegistrou 
            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
            : isReposicao
              ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
              : temFaltasConsecutivas
                ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
                : 'bg-card border-border'
        }`}
      >
        {/* Coluna 1: Foto + Dados do Aluno */}
        <div className="flex items-center gap-3">
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
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <p className="font-medium text-foreground">{aluno.nome}</p>
              {isReposicao && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Reposição
                </Badge>
              )}
            </div>
            
            {aluno.origem === 'funcionario' && (
              <span className="text-xs text-muted-foreground">(Funcionário)</span>
            )}
            
            {/* Turma original (apenas para reposições) */}
            {isReposicao && aluno.turmaOriginalNome && (
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                Turma original: {aluno.turmaOriginalNome}
              </p>
            )}
            
            {/* Apostila atual */}
            {aluno.ultimo_nivel && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                Apostila: {aluno.ultimo_nivel}
              </p>
            )}
            
            {/* Página e páginas restantes */}
            {aluno.ultima_pagina && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Página: {aluno.ultima_pagina} de {totalPaginas}
                {paginasRestantes !== null && paginasRestantes > 0 && (
                  <span className="text-primary font-medium">
                    ({paginasRestantes} restantes)
                  </span>
                )}
              </p>
            )}
            
            {/* Desafio da semana */}
            {aluno.niveldesafio && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Target className="h-3 w-3" />
                Desafio: {aluno.niveldesafio}
              </p>
            )}
            
            {/* Faltas consecutivas */}
            {temFaltasConsecutivas && (
              <p className="text-xs text-orange-600 dark:text-orange-400 font-medium flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {aluno.faltas_consecutivas} falta{aluno.faltas_consecutivas! > 1 ? 's' : ''} consecutiva{aluno.faltas_consecutivas! > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
        
        {/* Coluna 2: Caixa de Lembretes (centralizada) */}
        {temLembretes && (
          <div className="flex-1 flex justify-center px-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 min-w-[180px]">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-2">Lembretes</p>
              <div className="space-y-1.5">
                {alunoLembretes.aniversarioHoje && (
                  <div className="flex items-center gap-2 text-sm text-pink-600 dark:text-pink-400">
                    <Cake className="h-4 w-4" />
                    <span>Aniversariante!</span>
                  </div>
                )}
                {alunoLembretes.camisetaPendente && (
                  <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                    <Shirt className="h-4 w-4" />
                    <span>Entregar camiseta</span>
                  </div>
                )}
                {alunoLembretes.apostilaAHPronta && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <BookMarked className="h-4 w-4" />
                    <span>Devolver apostila AH</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Coluna 3: Botões de ação */}
        <div className="flex gap-2 shrink-0">
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
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => onRegistrarPresenca(aluno, true)}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Presente
              </Button>
              <Button
                onClick={() => onRegistrarPresenca(aluno, false)}
                size="sm"
                variant="destructive"
              >
                Falta
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Seção: Alunos da Turma */}
        {alunos.length > 0 && (
          <div className="space-y-2">
            {alunos.map((aluno) => renderAlunoCard(aluno, false))}
          </div>
        )}

        {/* Seção: Reposições de Hoje */}
        {alunosReposicao.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mt-4 mb-2">
              <RefreshCw className="h-4 w-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                Reposições de Hoje ({alunosReposicao.length})
              </h3>
            </div>
            {alunosReposicao.map((aluno) => renderAlunoCard(aluno, true))}
          </div>
        )}
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
    </TooltipProvider>
  );
};

export default SalaAlunosListaTable;

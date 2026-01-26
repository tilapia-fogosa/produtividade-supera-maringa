
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserPlus } from "lucide-react";
import { Turma } from '@/hooks/use-professor-turmas';
import { SalaPessoaTurma } from '@/hooks/sala/use-sala-pessoas-turma';
import { LembretesAluno } from '@/hooks/sala/use-lembretes-alunos';
import { ReposicaoHoje } from '@/hooks/sala/use-reposicoes-hoje';
import SalaAlunosListaTable from './SalaAlunosListaTable';
import { Card, CardContent } from "@/components/ui/card";

interface SalaProdutividadeScreenProps {
  turma: Turma;
  onBack: () => void;
  alunos?: SalaPessoaTurma[];
  onRegistrarPresenca?: (aluno: SalaPessoaTurma, presente: boolean) => void;
  onExcluirRegistro?: (aluno: SalaPessoaTurma) => void;
  produtividadeRegistrada?: Record<string, boolean>;
  onReposicao?: () => void;
  lembretes?: Record<string, LembretesAluno>;
  reposicoesHoje?: ReposicaoHoje[];
  onLembreteConcluido?: () => void;
}

const SalaProdutividadeScreen: React.FC<SalaProdutividadeScreenProps> = ({
  turma,
  onBack,
  alunos = [],
  onRegistrarPresenca = () => {},
  onExcluirRegistro,
  produtividadeRegistrada = {},
  onReposicao,
  lembretes = {},
  reposicoesHoje = [],
  onLembreteConcluido
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{turma.nome}</h1>
          <p className="text-sm text-muted-foreground">
            {turma.dia_semana} • Sala {turma.sala || '-'}
          </p>
        </div>
      </div>

      {/* Lista de Alunos */}
      <div className="flex-1 overflow-auto">
        <SalaAlunosListaTable 
          alunos={alunos}
          onRegistrarPresenca={onRegistrarPresenca}
          onExcluirRegistro={onExcluirRegistro}
          produtividadeRegistrada={produtividadeRegistrada}
          lembretes={lembretes}
          reposicoesHoje={reposicoesHoje}
          onLembreteConcluido={onLembreteConcluido}
        />
      </div>

      {/* Card de Reposição */}
      <Card 
        className="mt-4 border-dashed border-2 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onReposicao}
      >
        <CardContent className="flex items-center gap-3 p-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">Reposição de Aula</p>
            <p className="text-sm text-muted-foreground">Lançar produtividade de aluno em reposição</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalaProdutividadeScreen;

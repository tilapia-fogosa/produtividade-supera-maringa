
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserPlus, CalendarIcon } from "lucide-react";
import { Turma } from '@/hooks/use-professor-turmas';
import { SalaPessoaTurma } from '@/hooks/sala/use-sala-pessoas-turma';
import { LembretesAluno } from '@/hooks/sala/use-lembretes-alunos';
import { ReposicaoHoje } from '@/hooks/sala/use-reposicoes-hoje';
import { AulaExperimentalHoje } from '@/hooks/sala/use-aulas-experimentais-hoje';
import SalaAlunosListaTable from './SalaAlunosListaTable';
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
  dataSelecionada?: Date;
  onDataChange?: (data: Date) => void;
  aulasExperimentais?: AulaExperimentalHoje[];
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
  onLembreteConcluido,
  dataSelecionada,
  onDataChange,
  aulasExperimentais = []
}) => {
  const dataExibida = dataSelecionada || new Date();
  const ehHoje = isToday(dataExibida);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
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

        {/* DatePicker */}
        <div className="flex items-center gap-2">
          {!ehHoje && (
            <Badge variant="secondary" className="text-xs">
              Retroativo
            </Badge>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !dataSelecionada && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dataExibida, "dd/MM/yyyy", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={dataSelecionada}
                onSelect={(date) => date && onDataChange?.(date)}
                disabled={(date) => date > new Date()}
                initialFocus
                locale={ptBR}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
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
          aulasExperimentais={aulasExperimentais}
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

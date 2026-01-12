
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Turma } from '@/hooks/use-professor-turmas';
import { SalaPessoaTurma } from '@/hooks/sala/use-sala-pessoas-turma';
import SalaAlunosListaTable from './SalaAlunosListaTable';

interface SalaProdutividadeScreenProps {
  turma: Turma;
  onBack: () => void;
  alunos?: SalaPessoaTurma[];
  onRegistrarPresenca?: (aluno: SalaPessoaTurma, presente: boolean) => void;
  onExcluirRegistro?: (aluno: SalaPessoaTurma) => void;
  produtividadeRegistrada?: Record<string, boolean>;
}

const SalaProdutividadeScreen: React.FC<SalaProdutividadeScreenProps> = ({
  turma,
  onBack,
  alunos = [],
  onRegistrarPresenca = () => {},
  onExcluirRegistro,
  produtividadeRegistrada = {}
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
        />
      </div>
    </div>
  );
};

export default SalaProdutividadeScreen;

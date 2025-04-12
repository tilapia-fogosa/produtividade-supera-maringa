
import React from 'react';
import { CardContent } from "@/components/ui/card";
import TurmasList from './TurmasList';
import TurmaDetail from './TurmaDetail';
import AlunoDetail from './AlunoDetail';
import TurmasVazia from './TurmasVazia';
import { Turma, Aluno } from '@/hooks/use-professor-turmas';

interface ProfessorConteudoProps {
  turmas: Turma[];
  turmaSelecionada: string | null;
  alunos: Aluno[];
  alunoDetalhes: Aluno | null;
  onTurmaSelecionada: (turmaId: string) => void;
  onRegistrarPresenca: (alunoId: string) => void;
  onShowAlunoDetails: (aluno: Aluno) => void;
  onVoltarParaTurmas: () => void;
  onFecharDetalhesAluno: () => void;
}

const ProfessorConteudo: React.FC<ProfessorConteudoProps> = ({
  turmas,
  turmaSelecionada,
  alunos,
  alunoDetalhes,
  onTurmaSelecionada,
  onRegistrarPresenca,
  onShowAlunoDetails,
  onVoltarParaTurmas,
  onFecharDetalhesAluno
}) => {
  return (
    <CardContent>
      {turmas.length === 0 ? (
        <TurmasVazia />
      ) : (
        <div className="grid gap-4">
          {!turmaSelecionada ? (
            // Lista de turmas
            <TurmasList 
              turmas={turmas} 
              onTurmaSelecionada={onTurmaSelecionada} 
            />
          ) : alunoDetalhes ? (
            // Detalhes do aluno
            <AlunoDetail 
              aluno={alunoDetalhes} 
              onVoltar={onFecharDetalhesAluno} 
            />
          ) : (
            // Lista de alunos da turma selecionada
            <TurmaDetail
              turma={turmas.find(t => t.id === turmaSelecionada)!}
              alunos={alunos}
              onVoltar={onVoltarParaTurmas}
              onShowAlunoDetails={onShowAlunoDetails}
              onRegistrarPresenca={onRegistrarPresenca}
            />
          )}
        </div>
      )}
    </CardContent>
  );
};

export default ProfessorConteudo;

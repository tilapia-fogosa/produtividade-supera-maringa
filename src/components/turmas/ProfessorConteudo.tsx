
import React from 'react';
import { CardContent } from "@/components/ui/card";
import TurmasList from './TurmasList';
import TurmaDetail from './TurmaDetail';
import AlunoDetail from './AlunoDetail';
import TurmasVazia from './TurmasVazia';
import { Turma } from '@/hooks/use-professor-turmas';
import { PessoaTurma } from '@/hooks/use-pessoas-turma';

interface ProfessorConteudoProps {
  turmas: Turma[];
  turmaSelecionada: string | null;
  alunos: PessoaTurma[];
  todosAlunos: PessoaTurma[];
  alunoDetalhes: PessoaTurma | null;
  produtividadeRegistrada?: Record<string, boolean>;
  onTurmaSelecionada: (turmaId: string) => void;
  onRegistrarPresenca: (alunoId: string) => void;
  onShowAlunoDetails: (aluno: PessoaTurma) => void;
  onVoltarParaTurmas: () => void;
  onFecharDetalhesAluno: () => void;
  initialServiceType?: string;
}

const ProfessorConteudo: React.FC<ProfessorConteudoProps> = ({
  turmas,
  turmaSelecionada,
  alunos,
  todosAlunos,
  alunoDetalhes,
  produtividadeRegistrada = {},
  onTurmaSelecionada,
  onRegistrarPresenca,
  onShowAlunoDetails,
  onVoltarParaTurmas,
  onFecharDetalhesAluno,
  initialServiceType = 'produtividade'
}) => {
  // Adiciona log para depuração
  console.log('Turmas recebidas no ProfessorConteudo:', turmas);
  console.log('Alunos recebidos no ProfessorConteudo:', alunos?.length);
  
  return (
    <CardContent className="bg-orange-50/50 rounded-b-lg p-3 md:p-6 text-azul-500">
      {turmas.length === 0 ? (
        <TurmasVazia />
      ) : (
        <div className="grid gap-2 md:gap-4 w-full">
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
              todosAlunos={todosAlunos}
              onVoltar={onVoltarParaTurmas}
              onShowAlunoDetails={onShowAlunoDetails}
              onRegistrarPresenca={onRegistrarPresenca}
              produtividadeRegistrada={produtividadeRegistrada}
              initialServiceType={initialServiceType}
            />
          )}
        </div>
      )}
    </CardContent>
  );
};

export default ProfessorConteudo;


import React from 'react';
import { useLocation } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import ProfessorHeader from './ProfessorHeader';
import ProfessorConteudo from './ProfessorConteudo';
import { useProfessorTurmas } from '@/hooks/use-professor-turmas';
import { useAlunos } from '@/hooks/use-alunos';
import { PessoaTurma } from '@/hooks/use-pessoas-turma';

const ProfessorTurmas = () => {
  const { professor, turmas, loading, navigate } = useProfessorTurmas();
  const location = useLocation();
  const initialServiceType = location.state?.serviceType === 'abrindo_horizontes' ? 'abrindo_horizontes' : 'produtividade';

  const {
    alunos,
    todosAlunos,
    turmaSelecionada,
    alunoDetalhes,
    carregandoAlunos,
    produtividadeRegistrada,
    handleTurmaSelecionada,
    handleRegistrarPresenca,
    mostrarDetalhesAluno,
    fecharDetalhesAluno,
    voltarParaTurmas,
    atualizarProdutividadeRegistrada
  } = useAlunos();

  const handleVoltar = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-4 px-2 text-center text-azul-500">
        <p>Carregando...</p>
      </div>
    );
  }

  // Convertemos os alunos para o formato PessoaTurma para compatibilidade
  const convertToPessoaTurma = (alunos: any[]): PessoaTurma[] => {
    return alunos.map(aluno => ({
      ...aluno,
      origem: 'aluno'
    })) as PessoaTurma[];
  };

  // Criamos um wrapper para a função mostrarDetalhesAluno que aceita PessoaTurma
  const handleShowAlunoDetails = (pessoaTurma: PessoaTurma) => {
    // Como PessoaTurma já contém todas as propriedades necessárias de Aluno,
    // podemos passar diretamente para mostrarDetalhesAluno
    mostrarDetalhesAluno(pessoaTurma as any);
  };

  return (
    <div className="container mx-auto py-4 px-2 md:py-8 md:px-4">
      <ProfessorHeader 
        professor={professor} 
        turmas={turmas} 
        onVoltar={handleVoltar} 
      />

      <Card className="border-orange-200 bg-white mt-2 md:mt-4 w-full overflow-hidden">
        <ProfessorConteudo 
          turmas={turmas}
          turmaSelecionada={turmaSelecionada}
          alunos={convertToPessoaTurma(alunos)}
          todosAlunos={convertToPessoaTurma(todosAlunos)}
          alunoDetalhes={alunoDetalhes ? {...alunoDetalhes, origem: 'aluno' as const} : null}
          produtividadeRegistrada={produtividadeRegistrada}
          onTurmaSelecionada={handleTurmaSelecionada}
          onRegistrarPresenca={handleRegistrarPresenca}
          onShowAlunoDetails={handleShowAlunoDetails}
          onVoltarParaTurmas={voltarParaTurmas}
          onFecharDetalhesAluno={fecharDetalhesAluno}
          initialServiceType={initialServiceType}
        />
      </Card>
    </div>
  );
};

export default ProfessorTurmas;

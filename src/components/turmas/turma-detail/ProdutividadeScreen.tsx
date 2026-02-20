
import React from 'react';
import { Button } from "@/components/ui/button";
import { Turma } from '@/hooks/use-professor-turmas';
import { PessoaTurma } from '@/hooks/use-pessoas-turma';
import ReposicaoButton from './ReposicaoButton';
import AlunosListaTable from './AlunosListaTable';
import { useNavigate, useParams } from 'react-router-dom';
import TurmaHeader from './TurmaHeader';
import { FileText } from 'lucide-react';

interface ProdutividadeScreenProps {
  turma: Turma;
  onBack: () => void;
  alunos?: PessoaTurma[];
  onRegistrarPresenca?: (aluno: PessoaTurma) => void;
  onExcluirRegistro?: (aluno: PessoaTurma) => void;
  onReposicaoAula?: () => void;
  produtividadeRegistrada?: Record<string, boolean>;
}

const ProdutividadeScreen: React.FC<ProdutividadeScreenProps> = ({
  turma,
  onBack,
  alunos = [],
  onRegistrarPresenca = () => {},
  onExcluirRegistro,
  onReposicaoAula = () => {},
  produtividadeRegistrada = {}
}) => {
  const navigate = useNavigate();
  const { turmaId } = useParams();

  const verDiario = () => {
    console.log('Navegando para o diário da turma:', turmaId);
    navigate(`/turma/${turmaId}/diario`, {
      state: { turmaId, serviceType: 'diario' }
    });
  };

  const irParaFichas = () => {
    console.log('Navegando para a página de fichas...');
    // Usamos state para garantir que possamos voltar para esta página
    navigate('/fichas', { state: { origem: 'produtividade', turmaId } });
  };

  return (
    <>
      <TurmaHeader
        turma={turma}
        onBack={onBack}
      />
      <div className="flex justify-between items-center mb-3">
        <div className="flex gap-2">
          <ReposicaoButton onClick={onReposicaoAula} />
          <Button 
            variant="outline"
            onClick={irParaFichas}
            className="border-orange-200 text-azul-500"
          >
            <FileText className="mr-2 h-4 w-4" />
            Fichas
          </Button>
        </div>
        <Button 
          variant="outline"
          onClick={verDiario}
          className="border-orange-200 text-azul-500"
        >
          Ver Diário
        </Button>
      </div>
      
      <AlunosListaTable 
        alunos={alunos}
        onRegistrarPresenca={onRegistrarPresenca}
        onExcluirRegistro={onExcluirRegistro}
        produtividadeRegistrada={produtividadeRegistrada}
      />
    </>
  );
};

export default ProdutividadeScreen;


import React from 'react';
import { Button } from "@/components/ui/button";
import { Aluno, Turma } from '@/hooks/use-professor-turmas';
import { useNavigate, useParams } from 'react-router-dom';
import TurmaHeader from './TurmaHeader';
import AlunosListaTable from './AlunosListaTable';
import { RefreshCw } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProdutividadeScreenProps {
  turma: Turma;
  onBack: () => void;
  alunos?: Aluno[];
  onRegistrarPresenca?: (alunoId: string) => void;
  onReposicaoAula?: () => void;
  produtividadeRegistrada?: Record<string, boolean>;
}

const ProdutividadeScreen: React.FC<ProdutividadeScreenProps> = ({
  turma,
  onBack,
  alunos = [],
  onRegistrarPresenca = () => {},
  onReposicaoAula = () => {},
  produtividadeRegistrada = {}
}) => {
  const navigate = useNavigate();
  const { turmaId } = useParams();
  const isMobile = useIsMobile();

  const verDiario = () => {
    console.log('Navegando para o diário da turma:', turmaId);
    navigate(`/turma/${turmaId}/diario`, {
      state: { turmaId, serviceType: 'diario' }
    });
  };

  // Adaptador para converter alunoId para função que recebe aluno completo
  const handleRegistrarPresenca = (aluno: Aluno) => {
    if (onRegistrarPresenca) {
      onRegistrarPresenca(aluno.id);
    }
  };

  return (
    <>
      <TurmaHeader
        turma={turma}
        onBack={onBack}
      />
      <div className="flex flex-col gap-3 mb-4">
        <Button 
          variant="outline" 
          size={isMobile ? "sm" : "default"} 
          onClick={onReposicaoAula} 
          className="w-full text-azul-500 border-orange-200 hover:bg-orange-100"
        >
          <RefreshCw className={`mr-1.5 ${isMobile ? "h-3.5 w-3.5" : "h-4 w-4"}`} />
          <span className={isMobile ? "text-xs" : ""}>Registrar Reposição de Aula</span>
        </Button>
        <Button 
          variant="outline"
          onClick={verDiario}
          className="w-full"
        >
          Ver Diário
        </Button>
      </div>
      
      <AlunosListaTable 
        alunos={alunos}
        onRegistrarPresenca={handleRegistrarPresenca}
        produtividadeRegistrada={produtividadeRegistrada}
      />
    </>
  );
};

export default ProdutividadeScreen;

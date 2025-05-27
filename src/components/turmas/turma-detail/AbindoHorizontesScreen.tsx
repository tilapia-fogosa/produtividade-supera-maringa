
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Turma } from '@/hooks/use-professor-turmas';
import { PessoaTurmaDetalhes } from '@/hooks/use-turma-detalhes';
import { useIsMobile } from "@/hooks/use-mobile";
import AlunosAHTable from './AlunosAHTable';
import AhLancamentoModal from '../AhLancamentoModal';

interface AbindoHorizontesScreenProps {
  turma: Turma;
  onBack: () => void;
  alunos?: PessoaTurmaDetalhes[];
  onBackToMenu?: () => void;
}

const AbindoHorizontesScreen: React.FC<AbindoHorizontesScreenProps> = ({ 
  turma,
  onBack,
  alunos = [],
  onBackToMenu = () => {}
}) => {
  const isMobile = useIsMobile();
  const [modalAberto, setModalAberto] = React.useState(false);
  const [pessoaSelecionada, setPessoaSelecionada] = React.useState<PessoaTurmaDetalhes | null>(null);
  const [ahRegistrado, setAhRegistrado] = React.useState<Record<string, boolean>>({});
  
  const handleSelecionarPessoa = (pessoa: PessoaTurmaDetalhes) => {
    console.log("Pessoa selecionada para correção AH:", pessoa.nome, "- Tipo:", pessoa.origem);
    setPessoaSelecionada(pessoa);
    setModalAberto(true);
  };
  
  const handleFecharModal = () => {
    setModalAberto(false);
    setPessoaSelecionada(null);
  };
  
  const handleModalSuccess = (pessoaId: string) => {
    setAhRegistrado(prev => ({
      ...prev,
      [pessoaId]: true
    }));
  };

  return (
    <>
      <div className="border-b border-orange-100 pb-2 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="mr-2 text-azul-400 hover:text-azul-500 hover:bg-orange-50"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
            
            <div>
              <h2 className={`font-bold text-azul-500 ${isMobile ? "text-lg" : "text-xl"}`}>
                {turma.nome}
              </h2>
              <p className="text-sm text-azul-400">Abrindo Horizontes</p>
            </div>
          </div>
        </div>
      </div>
      
      <AlunosAHTable 
        alunos={alunos} 
        onSelecionarAluno={handleSelecionarPessoa} 
        ahRegistrado={ahRegistrado}
      />
      
      {pessoaSelecionada && (
        <AhLancamentoModal
          isOpen={modalAberto}
          aluno={pessoaSelecionada}
          onClose={handleFecharModal}
          onSuccess={handleModalSuccess}
        />
      )}
    </>
  );
};

export default AbindoHorizontesScreen;

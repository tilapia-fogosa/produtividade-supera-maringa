
import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useProfessorTurmas } from '@/hooks/use-professor-turmas';
import { usePessoasTurma } from '@/hooks/use-pessoas-turma';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import DiarioTurmaScreen from '@/components/turmas/turma-detail/DiarioTurmaScreen';

const DiarioTurma = () => {
  const { turmaId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { turmas } = useProfessorTurmas();
  const { pessoasTurma, buscarPessoasPorTurma } = usePessoasTurma();
  
  // Busca as pessoas (alunos e funcionários) quando o componente é montado
  React.useEffect(() => {
    if (turmaId) {
      buscarPessoasPorTurma(turmaId);
    }
  }, [turmaId, buscarPessoasPorTurma]);
  
  const dia = location.state?.dia;
  const serviceType = location.state?.serviceType || 'diario';
  
  const turma = turmas.find(t => t.id === turmaId);
  
  if (!turma) {
    return (
      <div className="container mx-auto py-4 px-2 text-center">
        <p>Turma não encontrada</p>
      </div>
    );
  }

  const handleVoltar = () => {
    navigate('/turmas/dia', { 
      state: { 
        dia,
        serviceType 
      }
    });
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-orange-950 dark:to-slate-950 text-azul-500 dark:text-orange-100">
      <div className="container mx-auto py-4 px-2">
        <Button 
          onClick={handleVoltar} 
          variant="outline" 
          className="mb-4 text-azul-500 border-orange-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        
        <h1 className="text-xl font-bold mb-4">Diário da Turma - {turma.nome}</h1>
        
        <DiarioTurmaScreen 
          turma={turma} 
          alunos={pessoasTurma} 
          onBack={handleVoltar} 
        />
      </div>
    </div>
  );
};

export default DiarioTurma;

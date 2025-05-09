
import React, { useEffect } from 'react';
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
  const { turmas, loading: turmasLoading } = useProfessorTurmas();
  const { pessoasTurma, buscarPessoasPorTurma, loading: pessoasLoading } = usePessoasTurma();
  
  // Busca as pessoas (alunos e funcionários) quando o componente é montado
  useEffect(() => {
    if (turmaId) {
      console.log("Buscando pessoas para a turma:", turmaId);
      buscarPessoasPorTurma(turmaId);
    }
  }, [turmaId, buscarPessoasPorTurma]);
  
  const dia = location.state?.dia;
  const serviceType = location.state?.serviceType || 'diario';
  
  const turma = turmas.find(t => t.id === turmaId);
  
  if (turmasLoading) {
    return (
      <div className="container mx-auto py-4 px-2 text-center">
        <p>Carregando informações da turma...</p>
      </div>
    );
  }

  if (!turma) {
    return (
      <div className="container mx-auto py-4 px-2 text-center">
        <p>Turma não encontrada</p>
        <Button 
          onClick={() => navigate('/diario')}
          variant="outline" 
          className="mt-4 text-laranja-DEFAULT border-laranja-DEFAULT hover:bg-laranja-DEFAULT/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Diário
        </Button>
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
    <div className="w-full min-h-screen text-laranja-DEFAULT">
      <div className="container mx-auto py-4 px-2">
        <Button 
          onClick={handleVoltar} 
          variant="outline" 
          className="mb-4 text-laranja-DEFAULT border-laranja-DEFAULT hover:bg-laranja-DEFAULT/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        
        <h1 className="text-xl font-bold mb-4 text-laranja-DEFAULT">Diário da Turma - {turma.nome}</h1>
        
        {pessoasLoading ? (
          <div className="text-center py-8">
            <p>Carregando alunos...</p>
          </div>
        ) : (
          <DiarioTurmaScreen 
            turma={turma} 
            alunos={pessoasTurma} 
            onBack={handleVoltar} 
          />
        )}
      </div>
    </div>
  );
};

export default DiarioTurma;

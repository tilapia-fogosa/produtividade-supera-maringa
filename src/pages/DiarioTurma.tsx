import React from 'react';
import { useLocation } from 'react-router-dom';
import { useProfessorTurmas } from '@/hooks/use-professor-turmas';
import { useAlunos } from '@/hooks/use-alunos';
import AbindoHorizontesScreen from '@/components/turmas/turma-detail/AbindoHorizontesScreen';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DiarioTurmaScreen from '@/components/turmas/turma-detail/DiarioTurmaScreen';

const DiarioTurma = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { turmas } = useProfessorTurmas();
  const { alunos } = useAlunos();
  
  const turmaId = location.state?.turmaId;
  const serviceType = location.state?.serviceType;
  const dia = location.state?.dia;
  
  const turma = turmas.find(t => t.id === turmaId);
  
  if (!turma) {
    return <div>Turma não encontrada</div>;
  }

  const handleVoltar = () => {
    navigate('/turmas/dia', { 
      state: { 
        dia,
        serviceType 
      }
    });
  };

  // Se o tipo de serviço for abrindo_horizontes, mostra a tela específica
  if (serviceType === 'abrindo_horizontes') {
    return (
      <div className="container mx-auto p-4">
        <AbindoHorizontesScreen 
          turma={turma}
          onBack={handleVoltar}
          alunos={alunos}
        />
      </div>
    );
  }

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
        
        <DiarioTurmaScreen turma={turma} onBack={handleVoltar} />
      </div>
    </div>
  );
};

export default DiarioTurma;

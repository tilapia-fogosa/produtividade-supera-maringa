
import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTurmaDetalhes } from '@/hooks/use-turma-detalhes';
import AbindoHorizontesScreen from '@/components/turmas/turma-detail/AbindoHorizontesScreen';

const AbrindoHorizontes = () => {
  const { turmaId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { turma, alunos, loading } = useTurmaDetalhes(turmaId);
  
  const dia = location.state?.dia;
  const serviceType = location.state?.serviceType || 'abrindo_horizontes';
  
  if (loading) {
    return (
      <div className="w-full min-h-screen text-azul-500 dark:text-orange-100">
        <div className="container mx-auto p-4 text-center">
          <p>Carregando...</p>
        </div>
      </div>
    );
  }
  
  if (!turma) {
    return (
      <div className="w-full min-h-screen text-azul-500 dark:text-orange-100">
        <div className="container mx-auto p-4 text-center">
          <p>Turma não encontrada</p>
        </div>
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
    <div className="w-full min-h-screen text-azul-500 dark:text-orange-100">
      <div className="container mx-auto p-4">
        <AbindoHorizontesScreen 
          turma={turma}
          onBack={handleVoltar}
          alunos={alunos}
        />
      </div>
    </div>
  );
};

export default AbrindoHorizontes;

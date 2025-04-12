
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProfessorTurmas from '@/components/turmas/ProfessorTurmas';

const Turmas = () => {
  const { professorId } = useParams<{ professorId: string }>();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!professorId) {
      navigate('/');
    }
  }, [professorId, navigate]);

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-orange-50 to-white text-azul-500">
      {professorId ? <ProfessorTurmas /> : null}
    </div>
  );
};

export default Turmas;

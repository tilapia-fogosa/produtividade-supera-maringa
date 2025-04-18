
import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ProfessorTurmas from '@/components/turmas/ProfessorTurmas';

const Turmas = () => {
  const { professorId } = useParams<{ professorId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    if (!professorId) {
      navigate('/');
    }
  }, [professorId, navigate]);

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-orange-950 dark:to-slate-950 text-azul-500 dark:text-orange-100">
      {professorId ? <ProfessorTurmas /> : null}
    </div>
  );
};

export default Turmas;

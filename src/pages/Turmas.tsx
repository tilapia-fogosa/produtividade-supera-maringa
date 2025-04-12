
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

  return professorId ? <ProfessorTurmas /> : null;
};

export default Turmas;

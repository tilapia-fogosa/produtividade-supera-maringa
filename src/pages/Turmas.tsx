
import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ProfessorTurmas from '@/components/turmas/ProfessorTurmas';

const Turmas = () => {
  const { professorId } = useParams<{ professorId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const serviceType = location.state?.serviceType || 'produtividade';
  
  useEffect(() => {
    if (!professorId) {
      navigate('/');
    }
  }, [professorId, navigate]);

  return (
    <div className="container mx-auto py-8">
      {professorId ? <ProfessorTurmas initialServiceType={serviceType} /> : null}
    </div>
  );
};

export default Turmas;

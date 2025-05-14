
import React from 'react';
import { useParams } from 'react-router-dom';

const TurmaDetail = () => {
  const { turmaId } = useParams<{ turmaId: string }>();
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Detalhes da Turma</h1>
      <p>ID da Turma: {turmaId}</p>
      <p>Detalhes completos serão implementados aqui.</p>
    </div>
  );
};

export default TurmaDetail;

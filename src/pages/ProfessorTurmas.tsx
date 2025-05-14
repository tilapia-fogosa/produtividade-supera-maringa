
import React from 'react';
import { useParams } from 'react-router-dom';

const ProfessorTurmas = () => {
  const { professorId } = useParams<{ professorId: string }>();
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Turmas do Professor</h1>
      <p>ID do Professor: {professorId}</p>
      <p>Lista de turmas será implementada aqui.</p>
    </div>
  );
};

export default ProfessorTurmas;

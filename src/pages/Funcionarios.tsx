
import React from 'react';
import FuncionariosList from '@/components/funcionarios/FuncionariosList';

const Funcionarios = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 text-azul-500">Gerenciamento de Funcionários</h1>
      <FuncionariosList />
    </div>
  );
};

export default Funcionarios;

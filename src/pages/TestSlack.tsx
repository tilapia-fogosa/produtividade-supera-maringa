
import React from 'react';
import TestSlackButtons from '../components/TestSlackButtons';

const TestSlack = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 mt-10">
        <h1 className="text-xl font-bold mb-4 text-center">Teste de Integração com Slack</h1>
        <TestSlackButtons />
      </div>
    </div>
  );
};

export default TestSlack;


import React from 'react';
import TestSlackButtons from '@/components/TestSlackButtons';

const TestSlack = () => {
  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold text-roxo-DEFAULT mb-6 text-center">
        Teste de Integração com Slack
      </h1>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <TestSlackButtons />
      </div>
    </div>
  );
};

export default TestSlack;

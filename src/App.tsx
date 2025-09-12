import React from 'react';

function App() {
  const handleNavigate = () => {
    window.location.href = '/cadastro-novo-aluno';
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <h1 className="text-2xl font-bold mb-4">Sistema Supera</h1>
      <button 
        onClick={handleNavigate}
        className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
      >
        Ir para Cadastro de Novo Aluno
      </button>
      
      {/* Renderizar diretamente o componente se a URL for correta */}
      {window.location.pathname === '/cadastro-novo-aluno' && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold">Cadastro de Novo Aluno</h2>
          <p>Formulário de cadastro aqui...</p>
        </div>
      )}
    </div>
  );
}

export default App;
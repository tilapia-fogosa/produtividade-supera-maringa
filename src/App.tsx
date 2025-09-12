import React from 'react';
import { AuthProvider } from "@/contexts/AuthContext";
import { ActiveUnitProvider } from "@/contexts/ActiveUnitContext";
import CadastroNovoAluno from "./pages/CadastroNovoAluno";
import GerenciarFotosAlunos from "./pages/GerenciarFotosAlunos";

function App() {
  const renderPage = () => {
    const path = window.location.pathname;
    
    if (path === '/cadastro-novo-aluno') {
      return <CadastroNovoAluno />;
    }
    
    if (path === '/gerenciar-fotos-alunos') {
      return <GerenciarFotosAlunos />;
    }
    
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Sistema Supera</h1>
        <button 
          onClick={() => window.location.href = '/cadastro-novo-aluno'}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 mr-2"
        >
          Cadastro de Novo Aluno
        </button>
        <button 
          onClick={() => window.location.href = '/gerenciar-fotos-alunos'}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
        >
          Gerenciar Fotos dos Alunos
        </button>
      </div>
    );
  };

  return (
    <AuthProvider>
      <ActiveUnitProvider>
        <div className="min-h-screen bg-background text-foreground">
          {renderPage()}
        </div>
      </ActiveUnitProvider>
    </AuthProvider>
  );
}

export default App;
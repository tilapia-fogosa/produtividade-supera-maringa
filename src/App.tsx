import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CadastroNovoAluno from "./pages/CadastroNovoAluno";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground">
        <Routes>
          <Route path="/" element={<Navigate to="/cadastro-novo-aluno" />} />
          <Route path="/cadastro-novo-aluno" element={<CadastroNovoAluno />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
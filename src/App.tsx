import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from "@/contexts/AuthContext";
import { ActiveUnitProvider } from "@/contexts/ActiveUnitContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";

// Import all pages
import Login from "./pages/Login";
import AccessDenied from "./pages/AccessDenied";
import NotFound from "./pages/NotFound";
import CadastroNovoAluno from "./pages/CadastroNovoAluno";
import GerenciarFotosAlunos from "./pages/GerenciarFotosAlunos";
import Lancamentos from "./pages/Lancamentos";
import Diario from "./pages/Diario";
import CalendarioAulas from "./pages/CalendarioAulas";
import Eventos from "./pages/Eventos";
import Estoque from "./pages/Estoque";
import Devolutivas from "./pages/Devolutivas";
import Fichas from "./pages/Fichas";
import Funcionarios from "./pages/Funcionarios";
import AlunosAtivos from "./pages/AlunosAtivos";
import SincronizarTurmas from "./pages/SincronizarTurmas";
import PainelPedagogico from "./pages/PainelPedagogico";
import CorrecoesAbrindoHorizontes from "./pages/CorrecoesAbrindoHorizontes";
import ProjetoSaoRafael from "./pages/ProjetoSaoRafael";
import Retencoes from "./pages/Retencoes";
import AdminConfiguracao from "./pages/AdminConfiguracao";
import Turmas from "./pages/Turmas";
import DiarioTurma from "./pages/DiarioTurma";
import ProdutividadeTurma from "./pages/ProdutividadeTurma";
import AbrindoHorizontes from "./pages/AbrindoHorizontes";
import AbrindoHorizontesAlunos from "./pages/AbrindoHorizontesAlunos";
import AbrindoHorizontesSelecao from "./pages/AbrindoHorizontesSelecao";
import Alunos from "./pages/Alunos";
import AulaZero from "./pages/AulaZero";
import DevolutivaAluno from "./pages/DevolutivaAluno";
import DevolutivaFuncionario from "./pages/DevolutivaFuncionario";
import DevolutivaTurma from "./pages/DevolutivaTurma";
import DiasLancamento from "./pages/DiasLancamento";
import EditarEvento from "./pages/EditarEvento";
import Professores from "./pages/Professores";
import ResultadosMensais from "./pages/ResultadosMensais";
import Trofeus1000Dias from "./pages/Trofeus1000Dias";

// Layout component for authenticated pages
const Layout = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider>
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  </SidebarProvider>
);

function App() {
  return (
    <AuthProvider>
      <ActiveUnitProvider>
        <Router>
          <div className="min-h-screen bg-background text-foreground">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/access-denied" element={<AccessDenied />} />
              
              {/* Protected routes with layout */}
              <Route path="/" element={<Navigate to="/lancamentos" replace />} />
              <Route path="/lancamentos" element={
                <ProtectedRoute>
                  <Layout><Lancamentos /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/diario" element={
                <ProtectedRoute>
                  <Layout><Diario /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/calendario-aulas" element={
                <ProtectedRoute>
                  <Layout><CalendarioAulas /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/eventos" element={
                <ProtectedRoute>
                  <Layout><Eventos /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/estoque" element={
                <ProtectedRoute>
                  <Layout><Estoque /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/devolutivas" element={
                <ProtectedRoute>
                  <Layout><Devolutivas /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/fichas" element={
                <ProtectedRoute>
                  <Layout><Fichas /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/funcionarios" element={
                <ProtectedRoute>
                  <Layout><Funcionarios /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/alunos-ativos" element={
                <ProtectedRoute>
                  <Layout><AlunosAtivos /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/sincronizar-turmas" element={
                <ProtectedRoute>
                  <Layout><SincronizarTurmas /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/painel-pedagogico" element={
                <ProtectedRoute>
                  <Layout><PainelPedagogico /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/correcoes-ah" element={
                <ProtectedRoute>
                  <Layout><CorrecoesAbrindoHorizontes /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/projeto-sao-rafael" element={
                <ProtectedRoute>
                  <Layout><ProjetoSaoRafael /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/retencoes" element={
                <ProtectedRoute>
                  <Layout><Retencoes /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/admin/configuracao" element={
                <ProtectedRoute>
                  <Layout><AdminConfiguracao /></Layout>
                </ProtectedRoute>
              } />
              
              {/* Additional routes */}
              <Route path="/turmas" element={
                <ProtectedRoute>
                  <Layout><Turmas /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/turma/:turmaId/diario" element={
                <ProtectedRoute>
                  <Layout><DiarioTurma /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/produtividade-turma" element={
                <ProtectedRoute>
                  <Layout><ProdutividadeTurma /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/abrindo-horizontes" element={
                <ProtectedRoute>
                  <Layout><AbrindoHorizontes /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/abrindo-horizontes-alunos" element={
                <ProtectedRoute>
                  <Layout><AbrindoHorizontesAlunos /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/abrindo-horizontes-selecao" element={
                <ProtectedRoute>
                  <Layout><AbrindoHorizontesSelecao /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/alunos" element={
                <ProtectedRoute>
                  <Layout><Alunos /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/aula-zero" element={
                <ProtectedRoute>
                  <Layout><AulaZero /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/devolutiva-aluno/:alunoId" element={
                <ProtectedRoute>
                  <Layout><DevolutivaAluno /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/devolutiva-funcionario/:funcionarioId" element={
                <ProtectedRoute>
                  <Layout><DevolutivaFuncionario /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/devolutiva-turma/:turmaId" element={
                <ProtectedRoute>
                  <Layout><DevolutivaTurma /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/dias-lancamento" element={
                <ProtectedRoute>
                  <Layout><DiasLancamento /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/editar-evento/:eventoId" element={
                <ProtectedRoute>
                  <Layout><EditarEvento /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/professores" element={
                <ProtectedRoute>
                  <Layout><Professores /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/resultados-mensais" element={
                <ProtectedRoute>
                  <Layout><ResultadosMensais /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/trofeus-1000-dias" element={
                <ProtectedRoute>
                  <Layout><Trofeus1000Dias /></Layout>
                </ProtectedRoute>
              } />
              
              {/* Special routes without sidebar */}
              <Route path="/cadastro-novo-aluno" element={
                <ProtectedRoute>
                  <CadastroNovoAluno />
                </ProtectedRoute>
              } />
              <Route path="/gerenciar-fotos-alunos" element={
                <ProtectedRoute>
                  <GerenciarFotosAlunos />
                </ProtectedRoute>
              } />
              
              {/* 404 page */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </div>
        </Router>
      </ActiveUnitProvider>
    </AuthProvider>
  );
}

export default App;
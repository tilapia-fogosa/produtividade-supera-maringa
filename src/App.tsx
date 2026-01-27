import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

// Componente que oculta ThemeToggle em rotas específicas
function ConditionalThemeToggle() {
  const location = useLocation();
  if (location.pathname === '/whatsapp') return null;
  return <ThemeToggle />;
}

// Componente de logout flutuante para perfil sala
function SalaLogoutButton() {
  const { profile, signOut } = useAuth();
  
  if (profile?.role !== 'sala') return null;
  
  return (
    <Button
      variant="destructive"
      size="icon"
      className="fixed top-4 right-4 z-50 print:hidden"
      onClick={signOut}
      title="Sair"
    >
      <LogOut className="h-4 w-4" />
    </Button>
  );
}

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { ActiveUnitProvider } from "@/contexts/ActiveUnitContext";
import { UnitSelector } from "@/components/UnitSelector";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Turmas from "./pages/Turmas";
import DiarioTurma from "./pages/DiarioTurma";
import ProdutividadeTurma from "./pages/ProdutividadeTurma";
import NotFound from "./pages/NotFound";
import PainelPedagogico from "./pages/PainelPedagogico";
import Estoque from "./pages/Estoque";
import Devolutivas from "./pages/Devolutivas";
import Lancamentos from "./pages/Lancamentos";
import DiasLancamento from "./pages/DiasLancamento";
import DevolutivaTurma from "./pages/DevolutivaTurma";
import DevolutivaAluno from "./pages/DevolutivaAluno";
import DevolutivaFuncionario from "./pages/DevolutivaFuncionario";
import DevolutivaFimAno from "./pages/DevolutivaFimAno";
import DevolutivaFimAnoImpressao from "./pages/DevolutivaFimAnoImpressao";
import DevolutivasControle from "./pages/DevolutivasControle";
import AbrindoHorizontes from "./pages/AbrindoHorizontes";
import AbrindoHorizontesSelecao from "./pages/AbrindoHorizontesSelecao";
import AbrindoHorizontesAlunos from "./pages/AbrindoHorizontesAlunos";
import AbrindoHorizontesFila from "./pages/AbrindoHorizontesFila";
import Diario from "./pages/Diario";
import Funcionarios from "./pages/Funcionarios";
import Alunos from "./pages/Alunos";
import AulaZero from "./pages/AulaZero";
import Fichas from "./pages/Fichas";
import AdminConfiguracao from "./pages/AdminConfiguracao";
import SincronizarTurmas from "./pages/SincronizarTurmas";
import AlunosAtivos from "./pages/AlunosAtivos";
import AlunosDevolutivas from "./pages/AlunosDevolutivas";
import ProjetoSaoRafael from "./pages/ProjetoSaoRafael";
import ProjetoSaoRafaelLancamento from "./pages/ProjetoSaoRafaelLancamento";
import CorrecoesAbrindoHorizontes from "./pages/CorrecoesAbrindoHorizontes";
import CalendarioAulas from "./pages/CalendarioAulas";
import Eventos from "./pages/Eventos";
import EditarEvento from "./pages/EditarEvento";
import Trofeus1000Dias from "./pages/Trofeus1000Dias";
import Retencoes from "./pages/Retencoes";
import ResultadosMensais from "./pages/ResultadosMensais";
import GerenciarFotosAlunos from "./pages/GerenciarFotosAlunos";
import CadastroNovoAluno from "./pages/CadastroNovoAluno";
import CRM from "./pages/CRM";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AccessDenied from "./pages/AccessDenied";
import PlanejadorDesafios from "./pages/PlanejadorDesafios";
import Camisetas from "./pages/Camisetas";
import AgendaProfessores from "./pages/AgendaProfessores";
import ReservasSala from "./pages/ReservasSala";
import AlertasFalta from "./pages/AlertasFalta";
import AlertasEvasao from "./pages/AlertasEvasao";
import RegistroPonto from "./pages/RegistroPonto";
import ControlePonto from "./pages/ControlePonto";
import MeuPerfil from "./pages/MeuPerfil";
import Home from "./pages/Home";
import TestGoogleCalendar from "./pages/TestGoogleCalendar";
import GaleriaFotos from "./pages/GaleriaFotos";
import VisualizadorImagens from "./pages/VisualizadorImagens";
import WhatsAppPage from "./pages/whatsapp";
import Avisos from "./pages/Avisos";
import PainelAdministrativo from "./pages/PainelAdministrativo";

// Páginas do fluxo Sala
import SalaLancamentos from "./pages/sala/SalaLancamentos";
import SalaDiasLancamento from "./pages/sala/SalaDiasLancamento";
import SalaTurmas from "./pages/sala/SalaTurmas";
import SalaProdutividadeTurma from "./pages/sala/SalaProdutividadeTurma";

const queryClient = new QueryClient();

// Layout protegido que oculta sidebar para perfil sala
function ProtectedLayout() {
  const { profile } = useAuth();
  const location = useLocation();
  const isSala = profile?.role === 'sala';

  // Redireciona perfil sala para /sala/lancamentos se tentar acessar / ou /home
  if (isSala && (location.pathname === '/' || location.pathname === '/home' || location.pathname === '/lancamentos')) {
    return <Navigate to="/sala/lancamentos" replace />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-hidden bg-background text-foreground">
        {/* Sidebar oculta para perfil sala */}
        {!isSala && (
          <div className="print:hidden">
            <AppSidebar />
          </div>
        )}
        <main className="flex-1 overflow-auto">
          <div className="p-2 md:p-4">
            <div className="flex items-center justify-between gap-4 mb-2 md:mb-4 print:hidden">
              {/* SidebarTrigger oculto para perfil sala */}
              {!isSala && <SidebarTrigger />}
              {isSala && <div />}
              <UnitSelector />
            </div>
            <Routes>
              <Route path="/" element={<Navigate to={isSala ? "/sala/lancamentos" : "/home"} />} />
              <Route path="/home" element={isSala ? <Navigate to="/sala/lancamentos" /> : <Home />} />
              <Route path="/lancamentos" element={isSala ? <Navigate to="/sala/lancamentos" /> : <Lancamentos />} />
              <Route path="/dias-lancamento" element={<DiasLancamento />} />
              <Route path="/turmas/dia" element={<Turmas />} />
              <Route path="/turma/:turmaId/produtividade" element={<ProdutividadeTurma />} />
              <Route path="/turma/:turmaId/abrindo-horizontes" element={<AbrindoHorizontes />} />
              <Route path="/abrindo-horizontes/selecao" element={<AbrindoHorizontesSelecao />} />
              <Route path="/abrindo-horizontes/alunos" element={<AbrindoHorizontesAlunos />} />
              <Route path="/turma/:turmaId/diario" element={<DiarioTurma />} />
              <Route path="/painel-pedagogico" element={<PainelPedagogico />} />
              <Route path="/estoque" element={<Estoque />} />
              <Route path="/devolutivas" element={<Devolutivas />} />
              <Route path="/devolutivas/alunos" element={<AlunosDevolutivas />} />
              <Route path="/devolutivas/turmas" element={<Turmas />} />
              <Route path="/devolutivas/turma/:turmaId" element={<DevolutivaTurma />} />
              <Route path="/devolutivas/aluno/:alunoId" element={<DevolutivaAluno />} />
              <Route path="/devolutivas/funcionario/:funcionarioId" element={<DevolutivaFuncionario />} />
              <Route path="/projeto-sao-rafael-devolutiva" element={<ProjetoSaoRafael />} />
              <Route path="/projeto-sao-rafael" element={<ProjetoSaoRafaelLancamento />} />
              <Route path="/fichas" element={<Fichas />} />
              <Route path="/lancamentos" element={<Lancamentos />} />
              <Route path="/abrindo-horizontes-fila" element={<AbrindoHorizontesFila />} />
              <Route path="/diario" element={<Diario />} />
              <Route path="/calendario-aulas" element={<CalendarioAulas />} />
              <Route path="/reservas-sala" element={<ReservasSala />} />
              <Route path="/agenda-professores" element={<AgendaProfessores />} />
              <Route path="/funcionarios" element={<Funcionarios />} />
              <Route path="/alunos" element={<Alunos />} />
              <Route path="/alunos-ativos" element={<AlunosAtivos />} />
              <Route path="/aula-zero" element={<AulaZero />} />
              <Route path="/admin/configuracao" element={<AdminConfiguracao />} />
              <Route path="/sincronizar-turmas" element={<SincronizarTurmas />} />
              <Route path="/correcoes-ah" element={<CorrecoesAbrindoHorizontes />} />
              <Route path="/eventos" element={<Eventos />} />
              <Route path="/eventos/:id/editar" element={<EditarEvento />} />
              <Route path="/trofeus-1000-dias" element={<Trofeus1000Dias />} />
              <Route path="/retencoes" element={<Retencoes />} />
              <Route path="/resultados-mensais" element={<ResultadosMensais />} />
              <Route path="/gerenciar-fotos-alunos" element={<GerenciarFotosAlunos />} />
              <Route path="/galeria-fotos" element={<GaleriaFotos />} />
              <Route path="/avisos" element={<Avisos />} />
              <Route path="/painel-administrativo" element={<PainelAdministrativo />} />
              <Route path="/cadastro-novo-aluno" element={<CadastroNovoAluno />} />
              <Route path="/crm" element={<CRM />} />
              <Route path="/whatsapp" element={<WhatsAppPage />} />
              <Route path="/planejador-desafios" element={<PlanejadorDesafios />} />
              <Route path="/camisetas" element={<Camisetas />} />
              <Route path="/devolutivas/devolutiva-fim-ano" element={<DevolutivaFimAno />} />
              <Route path="/devolutivas/controle" element={<DevolutivasControle />} />
              <Route path="/alertas-falta" element={<AlertasFalta />} />
              <Route path="/alertas-evasao" element={<AlertasEvasao />} />
              <Route path="/registro-ponto" element={<RegistroPonto />} />
              <Route path="/controle-ponto" element={<ControlePonto />} />
              <Route path="/meu-perfil" element={<MeuPerfil />} />
              <Route path="/teste-google-calendar" element={<TestGoogleCalendar />} />
              
              {/* Rotas do fluxo Sala */}
              <Route path="/sala/lancamentos" element={<SalaLancamentos />} />
              <Route path="/sala/dias-lancamento" element={<SalaDiasLancamento />} />
              <Route path="/sala/turmas/dia" element={<SalaTurmas />} />
              <Route path="/sala/turma/:turmaId/produtividade" element={<SalaProdutividadeTurma />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </main>
        {/* Botão de logout flutuante para perfil sala */}
        <SalaLogoutButton />
      </div>
      <div className="fixed bottom-4 right-4 print:hidden">
        <ConditionalThemeToggle />
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <ActiveUnitProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/auth/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/access-denied" element={<AccessDenied />} />
                <Route path="/devolutiva-fim-ano-impressao" element={<DevolutivaFimAnoImpressao />} />
                <Route path="/visualizador" element={<VisualizadorImagens />} />
                <Route path="/*" element={
                  <ProtectedRoute>
                    <ProtectedLayout />
                  </ProtectedRoute>
                } />
              </Routes>
            </BrowserRouter>
          </ActiveUnitProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

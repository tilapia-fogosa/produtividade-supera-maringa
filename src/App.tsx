
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ui/theme-toggle";
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
import AbrindoHorizontes from "./pages/AbrindoHorizontes";
import AbrindoHorizontesSelecao from "./pages/AbrindoHorizontesSelecao";
import AbrindoHorizontesAlunos from "./pages/AbrindoHorizontesAlunos";
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
import CorrecoesAbrindoHorizontes from "./pages/CorrecoesAbrindoHorizontes";
import CalendarioAulas from "./pages/CalendarioAulas";
import Eventos from "./pages/Eventos";
import EditarEvento from "./pages/EditarEvento";
import Trofeus1000Dias from "./pages/Trofeus1000Dias";
import Retencoes from "./pages/Retencoes";
import ResultadosMensais from "./pages/ResultadosMensais";
import Login from "./pages/Login";
import AccessDenied from "./pages/AccessDenied";

const queryClient = new QueryClient();

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
                <Route path="/access-denied" element={<AccessDenied />} />
                <Route path="/*" element={
                  <ProtectedRoute>
                    <SidebarProvider>
                    <div className="flex min-h-screen w-full overflow-hidden bg-background text-foreground">
                      <div className="print:hidden">
                        <AppSidebar />
                      </div>
                      <main className="flex-1 overflow-auto">
                        <div className="p-2 md:p-4">
                          <div className="flex items-center justify-between gap-4 mb-2 md:mb-4 print:hidden">
                            <SidebarTrigger />
                            <UnitSelector />
                          </div>
                          <Routes>
                            <Route path="/" element={<Navigate to="/lancamentos" />} />
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
                            <Route path="/projeto-sao-rafael" element={<ProjetoSaoRafael />} />
                            <Route path="/fichas" element={<Fichas />} />
                            <Route path="/lancamentos" element={<Lancamentos />} />
                            <Route path="/diario" element={<Diario />} />
                            <Route path="/calendario-aulas" element={<CalendarioAulas />} />
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
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </div>
                      </main>
                    </div>
                    <div className="fixed bottom-4 right-4 print:hidden">
                      <ThemeToggle />
                    </div>
                    </SidebarProvider>
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

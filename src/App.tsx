import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
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
import AbrindoHorizontes from "./pages/AbrindoHorizontes";
import Diario from "./pages/Diario";
import Funcionarios from "./pages/Funcionarios";
import Alunos from "./pages/Alunos";
import AulaZero from "./pages/AulaZero";
import Fichas from "./pages/Fichas";
import AdminConfiguracao from "./pages/AdminConfiguracao";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="bg-background min-h-screen text-foreground">
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <SidebarProvider>
              <div className="flex min-h-screen w-full overflow-hidden">
                <AppSidebar />
                <main className="flex-1 overflow-auto">
                  <div className="p-2 md:p-4">
                    <SidebarTrigger className="mb-2 md:mb-4" />
                    <Routes>
                      <Route path="/" element={<Navigate to="/lancamentos" />} />
                      <Route path="/dias-lancamento" element={<DiasLancamento />} />
                      <Route path="/turmas/dia" element={<Turmas />} />
                      <Route path="/turma/:turmaId/produtividade" element={<ProdutividadeTurma />} />
                      <Route path="/turma/:turmaId/abrindo-horizontes" element={<AbrindoHorizontes />} />
                      <Route path="/turma/:turmaId/diario" element={<DiarioTurma />} />
                      <Route path="/painel-pedagogico" element={<PainelPedagogico />} />
                      <Route path="/estoque" element={<Estoque />} />
                      <Route path="/devolutivas" element={<Devolutivas />} />
                      <Route path="/devolutivas/turmas" element={<Turmas />} />
                      <Route path="/devolutivas/turma/:turmaId" element={<DevolutivaTurma />} />
                      <Route path="/devolutivas/aluno/:alunoId" element={<DevolutivaAluno />} />
                      <Route path="/fichas" element={<Fichas />} />
                      <Route path="/lancamentos" element={<Lancamentos />} />
                      <Route path="/diario" element={<Diario />} />
                      <Route path="/diario" element={<Navigate to="/dias-lancamento" state={{ serviceType: 'diario_turma' }} />} />
                      <Route path="/funcionarios" element={<Funcionarios />} />
                      <Route path="/alunos" element={<Alunos />} />
                      <Route path="/aula-zero" element={<AulaZero />} />
                      <Route path="/admin/configuracao" element={<AdminConfiguracao />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </div>
                </main>
              </div>
            </SidebarProvider>
          </BrowserRouter>
          <div className="fixed bottom-4 right-4">
            <ThemeToggle />
          </div>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

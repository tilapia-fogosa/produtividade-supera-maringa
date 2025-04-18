
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Professores from "./pages/Professores";
import Turmas from "./pages/Turmas";
import DiarioTurma from "./pages/DiarioTurma";
import NotFound from "./pages/NotFound";
import Servicos from "./pages/Servicos";
import PainelPedagogico from "./pages/PainelPedagogico";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <div className="bg-gradient-to-b from-orange-50 to-white dark:from-orange-950 dark:to-slate-950 min-h-screen text-azul-500 dark:text-orange-100">
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <div className="flex min-h-screen w-full">
              <AppSidebar />
              <main className="flex-1">
                <div className="p-4">
                  <SidebarTrigger className="mb-4" />
                  <Routes>
                    <Route path="/" element={<Professores />} />
                    <Route path="/turmas/:professorId" element={<Turmas />} />
                    <Route path="/diario/:turmaId" element={<DiarioTurma />} />
                    <Route path="/diario" element={<DiarioTurma />} />
                    <Route path="/servicos" element={<Servicos />} />
                    <Route path="/painel-pedagogico" element={<PainelPedagogico />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </main>
            </div>
          </SidebarProvider>
        </BrowserRouter>
        <ThemeToggle />
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

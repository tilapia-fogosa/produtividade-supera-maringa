
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Professores from "./pages/Professores";
import Turmas from "./pages/Turmas";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <div className="bg-gradient-to-b from-orange-50 to-white dark:from-orange-950 dark:to-slate-950 min-h-screen text-azul-500 dark:text-orange-100">
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Professores />} />
            <Route path="/turmas/:professorId" element={<Turmas />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <ThemeToggle />
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

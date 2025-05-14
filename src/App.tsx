
import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from "./components/theme-provider"
import { useTheme } from 'next-themes'
import { Toaster } from "@/components/ui/toaster"
import AppSidebar from './components/AppSidebar'
import NotFound from './pages/NotFound'
import LoadingFallback from './components/LoadingFallback'

function App() {
  const [isMounted, setIsMounted] = useState(false)
  const { setTheme } = useTheme()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Auto mudar tema para dark ao iniciar
  useEffect(() => {
    if (isMounted) {
      setTheme('dark')
    }
  }, [isMounted, setTheme])
  
  return (
    <ThemeProvider>
      <Router>
        <AppSidebar />
        <main className="flex-1 overflow-auto bg-background">
          <Routes>
            <Route path="/" element={<Navigate replace to="/dashboard" />} />
            <Route path="/dashboard" element={<Suspense fallback={<LoadingFallback />}><Dashboard /></Suspense>} />
            <Route path="/turmas" element={<Suspense fallback={<LoadingFallback />}><Turmas /></Suspense>} />
            <Route path="/alunos" element={<Suspense fallback={<LoadingFallback />}><Alunos /></Suspense>} />
            <Route path="/professores" element={<Suspense fallback={<LoadingFallback />}><Professores /></Suspense>} />
            <Route path="/corretores" element={<Suspense fallback={<LoadingFallback />}><Corretores /></Suspense>} />
            <Route path="/lancamentos" element={<Suspense fallback={<LoadingFallback />}><Lancamentos /></Suspense>} />
            <Route path="/dias-lancamento" element={<Suspense fallback={<LoadingFallback />}><DiasLancamento /></Suspense>} />
            <Route path="/aula-zero" element={<Suspense fallback={<LoadingFallback />}><AulaZero /></Suspense>} />
            <Route path="/test-slack" element={<Suspense fallback={<LoadingFallback />}><TestSlack /></Suspense>} />
            <Route path="/turma/:turmaId" element={<Suspense fallback={<LoadingFallback />}><TurmaDetail /></Suspense>} />
            <Route path="/turma/:turmaId/diario" element={<Suspense fallback={<LoadingFallback />}><DiarioTurma /></Suspense>} />
            <Route path="/professor/:professorId" element={<Suspense fallback={<LoadingFallback />}><ProfessorTurmas /></Suspense>} />
            <Route path="/fichas" element={<Suspense fallback={<LoadingFallback />}><Fichas /></Suspense>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Toaster />
      </Router>
    </ThemeProvider>
  );
}

export default App

// Lazy loading dos componentes
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Turmas = lazy(() => import('./pages/Turmas'))
const Alunos = lazy(() => import('./pages/Alunos'))
const Professores = lazy(() => import('./pages/Professores'))
const Corretores = lazy(() => import('./pages/Corretores'))
const Lancamentos = lazy(() => import('./pages/Lancamentos'))
const DiasLancamento = lazy(() => import('./pages/DiasLancamento'))
const AulaZero = lazy(() => import('./pages/AulaZero'))
const TestSlack = lazy(() => import('./pages/TestSlack'))
const TurmaDetail = lazy(() => import('./pages/TurmaDetail'))
const DiarioTurma = lazy(() => import('./pages/DiarioTurma'))
const ProfessorTurmas = lazy(() => import('./pages/ProfessorTurmas'))
const Fichas = lazy(() => import('./pages/Fichas'))

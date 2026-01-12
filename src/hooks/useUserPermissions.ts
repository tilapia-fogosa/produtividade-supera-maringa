import { useAuth } from '@/contexts/AuthContext';

// Mapeamento de permissões por página
const PAGE_PERMISSIONS = {
  '/lancamentos': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin', 'sala'],
  '/dias-lancamento': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin', 'sala'],
  '/turmas/dia': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin', 'sala'],
  '/diario': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin', 'sala'],
  '/calendario-aulas': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin', 'sala'],
  '/estoque': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin', 'sala'],
  '/devolutivas': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin', 'sala'],
  '/fichas': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin', 'sala'],
  '/funcionarios': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin', 'sala'],
  '/alunos': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin', 'sala'],
  '/alunos-ativos': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin', 'sala'],
  '/turma': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin', 'sala'], // rotas dinâmicas de turma
  '/devolutivas/turma': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin', 'sala'],
  '/devolutivas/aluno': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin', 'sala'],
  '/devolutivas/funcionario': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin', 'sala'],
  '/painel-pedagogico': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin', 'sala'],
  '/projeto-sao-rafael': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin', 'sala'],
  '/correcoes-ah': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin', 'sala'],
  '/aula-zero': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin', 'sala'],
  '/admin/configuracao': ['admin'], // Só admin tem acesso
} as const;

export const useUserPermissions = () => {
  const { profile, loading } = useAuth();

  const hasPageAccess = (path: string): boolean => {
    if (loading || !profile) return false;
    
    // Admin sempre tem acesso a tudo
    if (profile.role === 'admin') return true;

    // Verifica se é uma rota dinâmica (contém parâmetros)
    const normalizedPath = normalizePath(path);
    
    const allowedRoles = PAGE_PERMISSIONS[normalizedPath as keyof typeof PAGE_PERMISSIONS];
    
    if (!allowedRoles) {
      // Se a rota não está mapeada, assume que é permitida para usuários autenticados
      return true;
    }

    return profile.role ? (allowedRoles as readonly string[]).includes(profile.role) : false;
  };

  const getAccessiblePages = () => {
    if (loading || !profile) return [];

    return Object.entries(PAGE_PERMISSIONS)
      .filter(([_, roles]) => {
        if (profile.role === 'admin') return true;
        return profile.role ? (roles as any).includes(profile.role) : false;
      })
      .map(([path]) => path);
  };

  const isAdmin = profile?.role === 'admin';
  const isManagement = profile?.role && (['franqueado', 'gestor_pedagogico', 'admin'] as const).includes(profile.role as any);
  const isFinanceiro = profile?.role === 'financeiro';
  const isAdministrativo = profile?.role === 'administrativo';
  const isEstagiario = profile?.role === 'estagiario';
  const isSala = profile?.role === 'sala';

  return {
    hasPageAccess,
    getAccessiblePages,
    isAdmin,
    isManagement,
    isFinanceiro,
    isAdministrativo,
    isEstagiario,
    isSala,
    userRole: profile?.role,
    loading
  };
};

// Função auxiliar para normalizar paths dinâmicos
const normalizePath = (path: string): string => {
  // Remove parâmetros de rota dinâmica para mapear corretamente
  if (path.startsWith('/turma/') && path.includes('/')) {
    const segments = path.split('/');
    if (segments[3] === 'produtividade') return '/turma';
    if (segments[3] === 'abrindo-horizontes') return '/turma';
    if (segments[3] === 'diario') return '/turma';
  }
  
  if (path.startsWith('/devolutivas/turma/')) return '/devolutivas/turma';
  if (path.startsWith('/devolutivas/aluno/')) return '/devolutivas/aluno';
  if (path.startsWith('/devolutivas/funcionario/')) return '/devolutivas/funcionario';
  
  return path;
};
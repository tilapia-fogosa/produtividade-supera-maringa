import { useAuth } from '@/contexts/AuthContext';

// Mapeamento de permissões por página
const PAGE_PERMISSIONS = {
  '/lancamentos': ['franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/dias-lancamento': ['franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/turmas/dia': ['franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/diario': ['franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/calendario-aulas': ['franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/estoque': ['franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/devolutivas': ['franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/fichas': ['franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/funcionarios': ['franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/alunos': ['franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/alunos-ativos': ['franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/turma': ['franqueado', 'gestor_pedagogico', 'educador', 'admin'], // rotas dinâmicas de turma
  '/devolutivas/turma': ['franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/devolutivas/aluno': ['franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/devolutivas/funcionario': ['franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/painel-pedagogico': ['franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/projeto-sao-rafael': ['franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/correcoes-ah': ['franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/aula-zero': ['franqueado', 'gestor_pedagogico', 'educador', 'admin'],
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
      // Se a rota não está mapeada, assume que é pública ou deve ser negada
      return false;
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

  return {
    hasPageAccess,
    getAccessiblePages,
    isAdmin,
    isManagement,
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
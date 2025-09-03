import { useAuth } from '@/contexts/AuthContext';

// Mapeamento de permissões por página
const PAGE_PERMISSIONS = {
  '/lancamentos': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/dias-lancamento': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/turmas/dia': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/diario': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/calendario-aulas': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/estoque': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/devolutivas': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/fichas': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/funcionarios': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/alunos': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/alunos-ativos': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/turma': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin'], // rotas dinâmicas de turma
  '/devolutivas/turma': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/devolutivas/aluno': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/devolutivas/funcionario': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/painel-pedagogico': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/projeto-sao-rafael': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/correcoes-ah': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/aula-zero': ['consultor', 'franqueado', 'gestor_pedagogico', 'educador', 'admin'],
  '/sincronizacao-sgs': ['franqueado', 'gestor_pedagogico', 'admin'], // Apenas gestão pode sincronizar SGS
  '/admin/gestao': ['admin'], // Apenas admins podem gerenciar sistema
  // '/admin/configuracao': removido - não deve aparecer para ninguém
} as const;

export const useUserPermissions = () => {
  const { profile, loading } = useAuth();

  const hasPageAccess = (path: string): boolean => {
    if (loading || !profile) return false;
    
    // Bloqueia completamente o acesso à página de configuração para TODOS os usuários
    if (path === '/admin/configuracao') return false;
    
    // Admin sempre tem acesso a tudo (exceto configuração)
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

  const isAdmin = profile?.is_admin === true || profile?.role === 'admin';
  const isManagement = isAdmin || (profile?.role && (['franqueado', 'gestor_pedagogico'] as const).includes(profile.role as any));

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
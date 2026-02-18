

## Correção do Logout - Sessão persistindo no localStorage

### Problema identificado

O `signOut()` do Supabase falha no servidor (sessão já expirada), mas o cliente Supabase nao limpa os tokens do localStorage quando recebe erro 403. Ao recarregar a página, o `AuthProvider` chama `getSession()`, encontra o token antigo no localStorage, faz refresh automático, e re-autentica o usuário.

### Solução

Duas alteracoes para garantir que o logout funcione em todos os cenarios:

1. **AppSidebar.tsx** - Limpar manualmente o localStorage do Supabase antes de redirecionar, como fallback caso o `signOut()` falhe:

```typescript
const handleLogout = async () => {
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
  }
  // Limpar manualmente como fallback
  localStorage.removeItem('sb-hkvjdxxndapxpslovrlc-auth-token');
  window.location.href = '/auth/login';
};
```

2. **AuthContext.tsx** - Atualizar a funcao `signOut` do contexto com a mesma logica, para que qualquer componente que use `signOut()` do contexto tambem funcione corretamente.

### Detalhes tecnicos

- `scope: 'local'` garante que o signOut limpa a sessao local sem depender do servidor
- A remocao manual do item `sb-hkvjdxxndapxpslovrlc-auth-token` do localStorage e um fallback de seguranca
- O `window.location.href` forca reload completo, limpando todo estado React em memoria

### Arquivos modificados

- `src/components/AppSidebar.tsx` - funcao `handleLogout`
- `src/contexts/AuthContext.tsx` - funcao `signOut`


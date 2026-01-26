

## Plano: Refresh Automático a Cada 60 Segundos

### Objetivo
Implementar um refresh automático dos dados de alunos, reposições e lembretes na tela de produtividade de sala (`/sala/turma/:turmaId/produtividade`) a cada 60 segundos.

### Abordagem
Adicionar um `useEffect` com `setInterval` que chama as funções de busca de dados periodicamente, garantindo limpeza adequada do intervalo ao desmontar o componente.

### Alterações Necessárias

#### 1. Atualizar Hook `useSalaPessoasTurma`
**Arquivo**: `src/hooks/sala/use-sala-pessoas-turma.ts`

Expor a função `buscarPessoasPorTurma` para permitir chamadas externas de refresh:
- A função já está sendo retornada pelo hook, então nenhuma alteração necessária aqui

#### 2. Atualizar Hook `useReposicoesHoje`
**Arquivo**: `src/hooks/sala/use-reposicoes-hoje.ts`

Expor uma função `refetch` para recarregar as reposições:

```typescript
// Adicionar função de refetch
const refetch = useCallback(() => {
  // Re-executar a query
}, [turmaId]);

return { reposicoes, loading, refetch };
```

#### 3. Implementar Refresh Automático na Página
**Arquivo**: `src/pages/sala/SalaProdutividadeTurma.tsx`

Adicionar lógica de refresh automático:

```typescript
// Constante para intervalo (60 segundos)
const REFRESH_INTERVAL = 60 * 1000;

// useEffect para refresh automático
useEffect(() => {
  if (!turmaId) return;

  const intervalId = setInterval(() => {
    console.log('[Sala] Refresh automático - recarregando dados...');
    buscarPessoasPorTurma(turmaId);
    // refetchReposicoes(); // se implementado
  }, REFRESH_INTERVAL);

  // Cleanup ao desmontar
  return () => {
    clearInterval(intervalId);
  };
}, [turmaId, buscarPessoasPorTurma]);
```

### Comportamento Esperado

```text
┌─────────────────────────────────────────────────────────────┐
│  Tela de Produtividade de Sala                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Página carrega] → Busca inicial de dados                  │
│        ↓                                                    │
│  [60s depois] → Refresh automático (silencioso)             │
│        ↓                                                    │
│  [120s depois] → Refresh automático (silencioso)            │
│        ↓                                                    │
│  [Usuário sai] → Intervalo limpo, sem memory leak           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Detalhes Técnicos

- O refresh será silencioso (sem loading spinner) para não interromper o fluxo do usuário
- Os dados locais (como produtividade já registrada) serão preservados e mesclados com os novos dados
- O intervalo será limpo corretamente ao navegar para outra página

### Arquivos a Modificar
1. **Editar**: `src/hooks/sala/use-reposicoes-hoje.ts` - Adicionar função `refetch`
2. **Editar**: `src/pages/sala/SalaProdutividadeTurma.tsx` - Implementar `setInterval` com refresh


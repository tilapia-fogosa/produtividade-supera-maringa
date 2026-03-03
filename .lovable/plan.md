

## Plano: Lembrete "Devolver AH" só após correção finalizada

### Situação Atual
No hook `useLembretesAlunos`, a query busca registros em `ah_recolhidas` onde `data_entrega_real IS NULL` — ou seja, o lembrete aparece assim que a apostila é **recolhida**, mesmo sem correção.

### Mudança
Adicionar um filtro na query para que o lembrete só apareça quando a correção estiver **finalizada** — isto é, quando existir um registro correspondente em `produtividade_ah` com `ah_recolhida_id` apontando para o registro de `ah_recolhidas`.

### Implementação

**Arquivo:** `src/hooks/sala/use-lembretes-alunos.ts`

1. Após buscar os `ah_recolhidas` (com `data_entrega_real IS NULL`), fazer uma segunda query em `produtividade_ah` filtrando pelos IDs retornados, para obter quais têm correção finalizada.
2. No mapa de apostilas AH pendentes, só incluir as que possuem registro correspondente em `produtividade_ah`.

Lógica simplificada:
```text
ah_recolhidas (data_entrega_real = NULL)
  → buscar IDs
  → produtividade_ah WHERE ah_recolhida_id IN (esses IDs)
  → só mostrar lembrete para os que têm match
```

Nenhuma alteração de banco necessária — apenas lógica no frontend.


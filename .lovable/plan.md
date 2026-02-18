

## Corrigir Salvamento de Aceleradores para Novas Unidades

### Problema
O hook `useComissaoConfig` retorna um config padrao com `id: ""` quando nao existe registro no banco para a unidade ativa. As funcoes `saveFormula` e `saveAceleradores` verificam `if (existing)`, mas como `existing` e sempre um objeto (nunca null), elas sempre tentam fazer UPDATE com `.eq("id", "")`, que nao encontra nenhuma linha e falha silenciosamente.

### Solucao
Corrigir a logica de decisao entre INSERT e UPDATE no hook `use-comissao-config.ts`, verificando se `existing.id` tem valor (nao e string vazia) ao inves de apenas verificar se `existing` existe.

### Alteracoes

**Arquivo: `src/hooks/use-comissao-config.ts`**

1. Na mutacao `saveFormula` (linha ~87): trocar `if (existing)` por `if (existing?.id)`
2. Na mutacao `saveAceleradores` (linha ~118): trocar `if (existing)` por `if (existing?.id)`

Isso garante que:
- Se ja existe um registro no banco (id preenchido), faz UPDATE
- Se nao existe registro (id vazio), faz INSERT com o `activeUnit.id`

### Detalhes Tecnicos

A mudanca e minima - apenas duas linhas de condicao. A logica de RLS ja esta correta (permite INSERT e UPDATE para franqueados e admins de unidades vinculadas). O problema era puramente no frontend.

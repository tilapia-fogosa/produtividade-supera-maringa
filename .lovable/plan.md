

## Correcao do RLS - Isolamento por Unidade (Alunos e Professores)

### Problema

A tabela `alunos` possui **duas** policies de SELECT conflitantes:

1. `alunos_select` -- usa `user_has_access_to_unit(unit_id)` (correta)
2. `authenticated_read_alunos` -- usa apenas `(active = true)` (problematica)

Como ambas sao PERMISSIVE, o Postgres aplica OR entre elas. Isso significa que **qualquer usuario autenticado ve todos os alunos ativos**, independente da unidade. A policy correta (`alunos_select`) acaba sendo ignorada na pratica.

A tabela `professores` esta OK -- possui apenas a policy `professores_select` com filtro de unidade.

### Solucao

Remover a policy `authenticated_read_alunos` da tabela `alunos`. A policy `alunos_select` ja cobre corretamente o acesso via `user_has_access_to_unit(unit_id)`.

### Secao Tecnica

**Migration SQL:**

```sql
DROP POLICY IF EXISTS "authenticated_read_alunos" ON public.alunos;
```

Apenas isso. As demais policies (`alunos_select`, `alunos_insert`, `alunos_update`, `alunos_delete`) ja estao corretas e usam `user_has_access_to_unit(unit_id)`.

**Funcao existente `user_has_access_to_unit`** -- ja trata o caso de admin (acesso global) e verifica vinculo ativo na `unit_users`. Nenhuma alteracao necessaria.

**Impacto:** Apos a remocao, usuarios so verao alunos das unidades vinculadas a eles na tabela `unit_users`. Admins continuam vendo tudo.

**Risco:** Se algum usuario nao estiver vinculado a nenhuma unidade na `unit_users`, ele deixara de ver qualquer aluno. Isso e o comportamento esperado.


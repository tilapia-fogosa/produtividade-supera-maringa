

## Correção da Função `user_has_access_to_unit` - Renomear Parâmetro

### Problema

A função `user_has_access_to_unit(unit_id uuid)` possui um bug de ambiguidade: o parâmetro `unit_id` tem o mesmo nome da coluna `unit_id` na tabela `unit_users`. O Postgres resolve essa ambiguidade usando a coluna, fazendo com que a comparação `uu.unit_id = unit_id` seja sempre verdadeira (`uu.unit_id = uu.unit_id`). Isso anula o filtro por unidade em **todas** as tabelas que usam essa função via RLS.

### Tabelas afetadas

- `alunos` (SELECT, INSERT, UPDATE, DELETE)
- `turmas` (SELECT, INSERT, UPDATE, DELETE)
- `professores` (SELECT, INSERT, UPDATE, DELETE)
- `funcionarios` (SELECT, INSERT, UPDATE, DELETE)
- `produtividade_abaco` (SELECT, INSERT, UPDATE, DELETE)

### Solução

Renomear o parâmetro de `unit_id` para `_unit_id` na função. As policies RLS não precisam ser alteradas pois chamam `user_has_access_to_unit(unit_id)` passando a **coluna** da tabela como argumento -- isso continuará funcionando corretamente.

### Plano de rollback

Caso a correção cause algum problema inesperado (ex: usuários deixam de ver dados que deveriam ver), basta reverter o parâmetro ao nome original. A migration incluirá o SQL de rollback comentado para referência rápida.

### Seção Técnica

**Migration SQL:**

```sql
CREATE OR REPLACE FUNCTION public.user_has_access_to_unit(_unit_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.unit_users uu
    WHERE uu.user_id = auth.uid()
      AND (uu.unit_id = _unit_id OR uu.role = 'admin')
      AND uu.active = true
  );
END;
$$;
```

**SQL de rollback (caso necessário, executar manualmente no SQL Editor):**

```sql
CREATE OR REPLACE FUNCTION public.user_has_access_to_unit(unit_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.unit_users uu
    WHERE uu.user_id = auth.uid()
      AND (uu.unit_id = user_has_access_to_unit.unit_id OR uu.role = 'admin')
      AND uu.active = true
  );
END;
$$;
```

> No rollback, usamos `user_has_access_to_unit.unit_id` para qualificar explicitamente o parâmetro e evitar a ambiguidade original. Isso é uma melhoria em relação ao código atual, mas a versão com `_unit_id` é mais limpa.

**Impacto:** Após a correção, todas as 5 tabelas listadas passarão a filtrar dados corretamente por unidade. Admins continuam com acesso global.

**Risco:** Usuários que não estiverem vinculados a nenhuma unidade na `unit_users` deixarão de ver qualquer dado dessas tabelas. Isso é o comportamento esperado.


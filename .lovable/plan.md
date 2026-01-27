

# Correção: Erro ao Carregar Dados no Painel Administrativo

## Problema Identificado

O erro ocorre porque existem **duas foreign keys** entre as tabelas `client_activities` e `clients`:
1. `client_activities_client_id_fkey`
2. `fk_client_activities_client_id`

Quando isso acontece, o Supabase/PostgREST não consegue determinar automaticamente qual relacionamento usar.

## Solução

Modificar a query no hook `use-pos-matricula.ts` para especificar explicitamente qual foreign key usar.

## Alteração Necessária

**Arquivo:** `src/hooks/use-pos-matricula.ts`

**De:**
```typescript
.select(`
  id,
  created_at,
  client_id,
  clients!inner (
    id,
    name,
    phone_number,
    email,
    status
  )
`)
```

**Para:**
```typescript
.select(`
  id,
  created_at,
  client_id,
  clients!client_activities_client_id_fkey (
    id,
    name,
    phone_number,
    email,
    status
  )
`)
```

## Resumo da Mudança

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/use-pos-matricula.ts` | Especificar FK explícita na query |

## Resultado Esperado

Após a correção, a página carregará corretamente os clientes matriculados em 2026.


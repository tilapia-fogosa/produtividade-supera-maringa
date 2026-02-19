
# Correção: unit_id null no webhook da Aula Inaugural

## Causa
A query que busca o `unit_id` da tabela `atividade_pos_venda` usa `.maybeSingle()`, mas existem multiplos registros para o mesmo `client_id`. Quando `.maybeSingle()` encontra mais de uma linha, ele retorna `null` em vez dos dados.

## Solucao
Adicionar `.limit(1)` na query para garantir que apenas um registro seja retornado antes do `.maybeSingle()`.

## Detalhes Tecnicos

### Arquivo: `src/components/painel-administrativo/DadosFinaisForm.tsx`

Alterar a query de busca do `unit_id` (por volta da linha 348-352):

**De:**
```typescript
const { data: atividadeData } = await supabase
  .from('atividade_pos_venda')
  .select('unit_id')
  .eq('client_id', cliente.id)
  .maybeSingle();
```

**Para:**
```typescript
const { data: atividadeData } = await supabase
  .from('atividade_pos_venda')
  .select('unit_id')
  .eq('client_id', cliente.id)
  .limit(1)
  .maybeSingle();
```

Alteracao de uma unica linha - apenas adicionar `.limit(1)` antes do `.maybeSingle()`.

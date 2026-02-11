

## Alterar lógica de sincronização de professores

### Problema atual
Quando um professor com o mesmo nome existe em outra unidade, a função move ele para a unidade atual, removendo-o da unidade original.

### Nova lógica
Cada professor será um registro independente por unidade. A busca passa a ser filtrada por `unit_id`:

- Se o professor já existe **na mesma unidade** -> reativa (status = true)
- Se o professor **não existe na unidade** -> cria um novo registro, independente de existir em outra unidade
- Remove toda a lógica de mover professor entre unidades
- Remove a lógica de remoção de duplicatas entre unidades

### Alteração técnica

**Arquivo:** `supabase/functions/sync-turmas-xls/index.ts`

Na Etapa 2 (Processar Professores), substituir a busca global (`ilike` sem filtro de unidade) por uma busca filtrada:

```typescript
// ANTES: busca global por nome em todas as unidades
const { data: existingProfs } = await supabase
  .from('professores')
  .select('id, unit_id, status')
  .ilike('nome', nome);

// DEPOIS: busca apenas na unidade atual
const { data: existingProf } = await supabase
  .from('professores')
  .select('id')
  .ilike('nome', nome)
  .eq('unit_id', unitId)
  .maybeSingle();
```

A lógica simplificada fica:
- Se encontrou na unidade -> reativa
- Se não encontrou -> cria novo registro com o `unit_id` atual

Toda a lógica de "mover entre unidades" e "remover duplicatas" será removida.



# Filtrar Aulas Inaugurais por atividade_pos_venda_id

## Problema Atual

O sistema filtra as aulas inaugurais usando `client_id`, mas um mesmo `client_id` pode ter multiplos registros na tabela `atividade_pos_venda`. Isso causa falsos positivos na filtragem (aula some do dashboard mesmo quando a documentacao correta nao foi concluida).

## Solucao

Adicionar o campo `atividade_pos_venda_id` na tabela `eventos_professor` e usar esse vinculo direto para verificar se a documentacao foi concluida.

## Etapas

### 1. Migration: Adicionar coluna `atividade_pos_venda_id` em `eventos_professor`

```sql
ALTER TABLE eventos_professor
ADD COLUMN atividade_pos_venda_id UUID REFERENCES atividade_pos_venda(id);
```

### 2. Preencher dados existentes (backfill)

Para eventos existentes que ja possuem `client_id`, vincular ao registro mais recente da `atividade_pos_venda`:

```sql
UPDATE eventos_professor ep
SET atividade_pos_venda_id = (
  SELECT apv.id FROM atividade_pos_venda apv
  WHERE apv.client_id = ep.client_id
  ORDER BY apv.created_at DESC
  LIMIT 1
)
WHERE ep.tipo_evento = 'aula_zero'
  AND ep.client_id IS NOT NULL
  AND ep.atividade_pos_venda_id IS NULL;
```

### 3. Atualizar o agendamento no `DadosFinaisForm.tsx`

No momento de inserir o evento em `eventos_professor`, passar o `atividade_pos_venda_id` (que ja esta disponivel como `cliente.id` -- o id da atividade_pos_venda no contexto do painel administrativo).

### 4. Atualizar os hooks de filtragem

**`use-aulas-inaugurais-professor.ts`** e **`use-professor-atividades.ts`**:
- Incluir `atividade_pos_venda_id` no select dos eventos
- Em vez de buscar todos os `client_id` e verificar na `atividade_pos_venda`, buscar diretamente pelo `atividade_pos_venda_id` do evento
- Verificar se os 5 campos pedagogicos estao preenchidos naquele registro especifico

## Detalhes Tecnicos

### Arquivos modificados

1. **Migration SQL** -- nova coluna + backfill
2. **`src/components/painel-administrativo/DadosFinaisForm.tsx`** -- incluir `atividade_pos_venda_id` no insert do evento
3. **`src/hooks/use-aulas-inaugurais-professor.ts`** -- filtrar por `atividade_pos_venda_id` em vez de `client_id`
4. **`src/hooks/use-professor-atividades.ts`** -- mesma mudanca de filtragem
5. **`src/hooks/use-salvar-dados-pedagogicos.ts`** -- se aplicavel, incluir `atividade_pos_venda_id` no insert

### Logica de filtragem nova

```text
Antes:
  evento.client_id -> busca TODOS os registros atividade_pos_venda com esse client_id
  -> se QUALQUER um tiver os 5 campos preenchidos, remove o evento

Depois:
  evento.atividade_pos_venda_id -> busca APENAS aquele registro especifico
  -> so remove se AQUELE registro tiver os 5 campos preenchidos
```

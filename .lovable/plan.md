
# Separar Atividades Pos-Venda por atividade_pos_venda_id

## Problema

O sistema usa `client_id` como identificador principal em todos os formularios do Painel Administrativo. Como 1 `client_id` pode ter multiplas vendas/matriculas (multiplos registros em `atividade_pos_venda`), os formularios acabam buscando/atualizando o registro errado ou conflitando entre si.

## Solucao

Propagar o `atividade_pos_venda.id` como identificador principal em vez do `client_id` em todo o fluxo de formularios.

## Etapas

### 1. Alterar `ClienteMatriculado` para incluir `atividade_pos_venda_id`

Adicionar o campo `atividade_pos_venda_id` na interface `ClienteMatriculado` em `src/hooks/use-pos-matricula.ts`. Manter o `id` (client_id) para compatibilidade, mas adicionar o novo campo.

### 2. Atualizar `AtividadesPosVendaTab.tsx`

No `handleOpenDrawer`, passar `atividade.id` (que ja e o `atividade_pos_venda.id`) como `atividade_pos_venda_id` no objeto `clienteParaDrawer`.

### 3. Atualizar `DadosFinaisForm.tsx`

Trocar todas as queries que usam `.eq("client_id", cliente.id)` para `.eq("id", cliente.atividade_pos_venda_id)` ao consultar/atualizar `atividade_pos_venda`. Para `eventos_professor`, usar `.eq("atividade_pos_venda_id", cliente.atividade_pos_venda_id)` em vez de `.eq("client_id", cliente.id)`. Remover a busca separada de `atividade_pos_venda.id` pois ja teremos o valor direto.

### 4. Atualizar hooks de salvamento

- **`use-salvar-dados-cadastrais.ts`**: trocar `.eq("client_id", input.clientId)` por `.eq("id", input.atividadePosVendaId)`
- **`use-salvar-dados-comerciais.ts`**: mesma mudanca
- **`use-salvar-dados-pedagogicos.ts`**: mesma mudanca

### 5. Atualizar formularios que chamam os hooks

- `DadosCadastraisForm.tsx`, `DadosComercaisForm.tsx`, `DadosPedagogicosForm.tsx`: passar `cliente.atividade_pos_venda_id` em vez de `cliente.id` como identificador para os hooks de salvamento.

### 6. Atualizar `use-alunos-sem-vinculo.ts`

A funcao `useAlunoVinculado` que busca `.eq("client_id", clientId)` precisa continuar usando `client_id` (pois o vinculo aluno-cliente e por `client_id`), entao esse hook nao muda.

## Detalhes Tecnicos

### Interface alterada

```text
ClienteMatriculado {
  id: string;                        // client_id (mantido)
  atividade_pos_venda_id: string;    // NOVO - id da atividade_pos_venda
  name: string;
  ...
}
```

### Arquivos modificados

1. `src/hooks/use-pos-matricula.ts` - adicionar campo na interface
2. `src/components/painel-administrativo/AtividadesPosVendaTab.tsx` - passar atividade.id
3. `src/components/painel-administrativo/DadosFinaisForm.tsx` - usar atividade_pos_venda_id nas queries
4. `src/hooks/use-salvar-dados-cadastrais.ts` - eq por id em vez de client_id
5. `src/hooks/use-salvar-dados-comerciais.ts` - eq por id em vez de client_id
6. `src/hooks/use-salvar-dados-pedagogicos.ts` - eq por id em vez de client_id
7. `src/components/painel-administrativo/DadosCadastraisForm.tsx` - passar atividade_pos_venda_id
8. `src/components/painel-administrativo/DadosComercaisForm.tsx` - passar atividade_pos_venda_id
9. `src/components/painel-administrativo/DadosPedagogicosForm.tsx` - passar atividade_pos_venda_id

### Regra importante

O vinculo `alunos.client_id` continua usando `client_id` normalmente, pois o aluno se vincula ao cliente (pessoa fisica). O que muda e que as queries na tabela `atividade_pos_venda` passam a usar o `id` direto em vez do `client_id`.

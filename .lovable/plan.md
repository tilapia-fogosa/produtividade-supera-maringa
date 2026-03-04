

## Plano: Vincular aluno_id automaticamente na aulas_inaugurais

### Problema
O `aluno_id` na tabela `aulas_inaugurais` é sempre `null` no momento do agendamento, pois o aluno pode não existir ainda. O vínculo do aluno acontece no formulário "Dados Iniciais" (`DadosFinaisForm.tsx`), onde o admin associa um aluno ao `client_id`.

### Solução
No `DadosFinaisForm.tsx`, após vincular o aluno (update em `alunos.client_id`), buscar se existe um registro em `aulas_inaugurais` para o mesmo `atividade_pos_venda_id` e atualizar o `aluno_id`.

### Alteração

**Arquivo:** `src/components/painel-administrativo/DadosFinaisForm.tsx`

Na mutation, após o bloco que faz `update({ client_id: cliente.id })` no aluno (linhas ~287-298), adicionar:

```typescript
// Atualizar aluno_id na aulas_inaugurais vinculada
await (supabase as any)
  .from('aulas_inaugurais')
  .update({ aluno_id: data.alunoId })
  .eq('atividade_pos_venda_id', cliente.atividade_pos_venda_id);
```

Mesma lógica no bloco de remoção de vínculo (linhas ~276-284): se o aluno anterior é removido, limpar o `aluno_id`:

```typescript
await (supabase as any)
  .from('aulas_inaugurais')
  .update({ aluno_id: null })
  .eq('atividade_pos_venda_id', cliente.atividade_pos_venda_id);
```

### Arquivo impactado
| Arquivo | Ação |
|---|---|
| `DadosFinaisForm.tsx` | Sincronizar `aluno_id` na `aulas_inaugurais` ao vincular/desvincular aluno |


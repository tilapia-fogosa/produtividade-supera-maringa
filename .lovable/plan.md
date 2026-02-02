
## Plano: Filtrar Registros de Reposição na Página Diário

### Problema Identificado

A página `/diario` usa o componente `DiarioTurmaAccordion.tsx`, que busca registros de produtividade sem filtrar reposições. O filtro que adicionei anteriormente estava no arquivo **errado** (`DiarioTurmaScreen.tsx`), que é usado apenas na rota `/diario-turma/:turmaId`.

### Situação Atual

Quando uma turma é expandida no accordion, a função `buscarDadosTurma` busca todos os registros sem filtrar:

```typescript
const { data: produtividadeData } = await supabase
  .from('produtividade_abaco')
  .select('*')
  .eq('data_aula', dataFormatada)
  .in('pessoa_id', pessoasIds);
// ❌ Sem filtro de is_reposicao
```

### Solução

Adicionar o filtro `.eq('is_reposicao', false)` na query do `DiarioTurmaAccordion.tsx` para excluir registros de reposição da lista de turmas regulares.

---

### Arquivo a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/diario/DiarioTurmaAccordion.tsx` | Adicionar filtro `is_reposicao = false` na query |

---

### Detalhes Técnicos

**Linha 103-107** - Alterar a query para incluir o filtro:

```typescript
// ANTES
const { data: produtividadeData, error: produtividadeError } = await supabase
  .from('produtividade_abaco')
  .select('*')
  .eq('data_aula', dataFormatada)
  .in('pessoa_id', pessoasIds);

// DEPOIS
const { data: produtividadeData, error: produtividadeError } = await supabase
  .from('produtividade_abaco')
  .select('*')
  .eq('data_aula', dataFormatada)
  .in('pessoa_id', pessoasIds)
  .or('is_reposicao.is.null,is_reposicao.eq.false');
```

**Nota**: Uso `.or('is_reposicao.is.null,is_reposicao.eq.false')` para incluir registros onde:
- `is_reposicao` é `null` (registros antigos que não têm esse campo preenchido)
- `is_reposicao` é `false` (aulas regulares)

Isso garante compatibilidade com registros antigos enquanto exclui as reposições (`is_reposicao = true`).

---

### Resultado Esperado

- **Turmas regulares**: Mostrarão apenas 1 registro por aluna (onde `is_reposicao = false` ou `null`)
- **Accordion de Reposições**: Continuará mostrando os registros onde `is_reposicao = true` (já funciona corretamente)

No caso específico do dia 24/01/2026:
- Maria Julia Oliveira Silva → 1 registro (aula regular)
- Anna Helena Bukow Natal → 1 registro (aula regular)
- As reposições aparecerão no accordion "Reposições" no final

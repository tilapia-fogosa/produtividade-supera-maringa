

## Fase 9: Migrar Alertas de Evasao para Multi-Unidades

### Resumo

Adicionar `unit_id` as 3 tabelas principais do sistema de evasao (`alerta_evasao`, `atividades_alerta_evasao`, `kanban_cards`), migrar dados existentes, atualizar RPCs, trigger automatica, e filtrar todos os hooks/paginas pela unidade ativa.

---

### Etapa 1 - Migracao de Banco de Dados

Uma unica migracao SQL que:

1. **Adiciona `unit_id`** (nullable inicialmente) nas 3 tabelas
2. **Preenche dados existentes**:
   - `alerta_evasao.unit_id` = `alunos.unit_id` (via `aluno_id`)
   - `atividades_alerta_evasao.unit_id` = `alerta_evasao.unit_id` (via `alerta_evasao_id`)
   - `kanban_cards.unit_id` = `alerta_evasao.unit_id` (via `alerta_evasao_id`)
   - Registros orfaos recebem a unidade de Maringa como fallback
3. **Torna NOT NULL** apos preenchimento
4. **Cria indices** de performance

---

### Etapa 2 - Atualizar Trigger Automatica

Recriar a funcao `criar_atividade_acolhimento_automatica` para copiar o `unit_id` do alerta pai para a atividade de acolhimento criada automaticamente.

---

### Etapa 3 - Atualizar RPCs

**`get_alunos_retencoes_historico`:**
- Adicionar parametro `p_unit_id uuid DEFAULT NULL`
- Filtrar por `a.unit_id = p_unit_id` quando informado

**`get_aluno_detalhes`:**
- Adicionar parametro `p_unit_id uuid DEFAULT NULL`
- Filtrar por `a.unit_id = p_unit_id` quando informado

---

### Etapa 4 - Atualizar Hooks (leitura/filtragem)

Todos os hooks abaixo recebem `useActiveUnit()` e filtram por `unit_id`:

| Hook | Alteracao |
|------|-----------|
| `use-alertas-evasao-lista.ts` | Filtrar `.eq('unit_id', activeUnit.id)`, adicionar na queryKey |
| `use-kanban-cards.ts` | Filtrar `.eq('unit_id', activeUnit.id)`, adicionar na queryKey |
| `use-atividades-evasao-home.ts` | Filtrar via JOIN (aluno.unit_id) ou direto, adicionar na queryKey |
| `use-retencoes-historico.ts` | Passar `p_unit_id` para RPC |

---

### Etapa 5 - Atualizar Hooks (escrita/criacao)

| Hook | Alteracao |
|------|-----------|
| `use-alertas-evasao.ts` | Incluir `unit_id: activeUnit.id` ao inserir novo alerta |
| `use-atividades-alerta-evasao.ts` | Incluir `unit_id` ao criar atividades (buscar do alerta pai) |

---

### Etapa 6 - Atualizar Paginas e Componentes

As paginas importam `useActiveUnit()` e passam o ID para os hooks:
- `AlertasEvasao.tsx`
- `PainelPedagogico.tsx`
- `Retencoes.tsx`

---

### Detalhes Tecnicos

**Padrao nos hooks:**
```typescript
import { useActiveUnit } from "@/contexts/ActiveUnitContext";
const { activeUnit } = useActiveUnit();

// queryKey inclui activeUnit?.id
// enabled inclui !!activeUnit?.id
// queries usam .eq('unit_id', activeUnit.id)
```

**Trigger atualizada:**
```sql
INSERT INTO atividades_alerta_evasao (
  alerta_evasao_id, tipo_atividade, descricao,
  responsavel_id, responsavel_nome,
  unit_id  -- NOVO: herda do alerta
) VALUES (
  NEW.id, 'acolhimento', v_descricao,
  NULL, COALESCE(v_professor_nome, 'Sistema'),
  NEW.unit_id  -- copia do alerta pai
);
```

**Migracao de dados (fallback Maringa):**
Registros que nao conseguirem resolver o `unit_id` via relacionamento (aluno deletado, etc) receberao a unidade de Maringa como padrao, garantindo que a coluna possa ser NOT NULL.

**Webhooks n8n/Make:**
Os payloads existentes ja enviam dados do aluno/turma. Nao ha necessidade imediata de incluir `unit_id` nos webhooks, mas o campo estara disponivel no banco caso necessario no futuro.


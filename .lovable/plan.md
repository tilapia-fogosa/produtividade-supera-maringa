

## Plano: Adicionar coluna `status_manual` na tabela `atividade_pos_venda`

### Objetivo
Criar uma coluna `status_manual` que permite forçar o status de conclusão de um registro, independente do preenchimento dos formulários. Todos os registros de 2025 ou antes serão marcados como "Concluido".

---

### Etapas de Implementação

#### 1. Criar Migration para Adicionar a Coluna
Adicionar a coluna `status_manual` do tipo TEXT (nullable) na tabela `atividade_pos_venda`.

```sql
ALTER TABLE atividade_pos_venda 
ADD COLUMN status_manual TEXT;
```

#### 2. Atualizar Registros Antigos
Executar UPDATE para marcar todos os registros com `created_at` em 2025 ou antes:

```sql
UPDATE atividade_pos_venda 
SET status_manual = 'Concluido' 
WHERE created_at < '2026-01-01';
```

#### 3. Atualizar Hook `use-atividades-pos-venda.ts`
Modificar a lógica de status para considerar o campo `status_manual`:

- Incluir `status_manual` no SELECT da query
- Na função que determina se a atividade está completa, verificar primeiro se `status_manual === 'Concluido'`
- Se `status_manual` estiver preenchido, usar esse valor; caso contrário, calcular dinamicamente como hoje

**Lógica atualizada:**
```typescript
// Se tem status_manual definido, usa ele
if (pv.status_manual === 'Concluido') {
  // Considera todas as seções como completas
  return { ...atividade, isCompleta: true };
}
// Caso contrário, calcula dinamicamente
```

---

### Detalhes Técnicos

| Item | Descrição |
|------|-----------|
| Tabela afetada | `atividade_pos_venda` |
| Nova coluna | `status_manual` (TEXT, nullable) |
| Valores possíveis | `'Concluido'` ou `NULL` |
| Registros afetados | Todos com `created_at < 2026-01-01` |
| Arquivos a modificar | `src/hooks/use-atividades-pos-venda.ts` |

---

### Resultado Esperado
- Registros de dezembro de 2025 ou antes aparecerão com status "Concluído" na aba Atividades Pós-Venda
- Novos registros (2026 em diante) continuarão usando a lógica dinâmica baseada no preenchimento dos formulários
- O campo `status_manual` poderá ser usado futuramente para forçar status em casos específicos




## Plano: Remover `client_id` da tabela `alunos` — arquivos restantes

Restam **3 arquivos** que referenciam `alunos.client_id`. As demais ocorrências de `client_id` no projeto são de outras tabelas (`clients`, `client_activities`, `eventos_professor`, `aulas_inaugurais`, `historico_comercial`) e **não são impactadas**.

---

### 1. `src/hooks/use-comissoes.ts` (linhas 59-68)

**O que faz hoje:** Coleta os `client_id` de cada atividade pós-venda, depois busca na tabela `alunos` quais têm um registro com esse `client_id` — isso determina se a etapa "finais" está completa (tem aluno vinculado).

**Mudança:** Trocar para buscar alunos por `atividade_pos_venda_id` (os IDs das atividades já estão disponíveis no resultado da query principal).

```
// DE:
const clientIds = [...new Set(data.map(d => d.client_id))]
supabase.from("alunos").select("client_id").in("client_id", clientIds)

// PARA:
const atividadeIds = data.map(d => d.id)
supabase.from("alunos").select("atividade_pos_venda_id").in("atividade_pos_venda_id", atividadeIds)
```

**Impacto:** Nenhum impacto funcional. O mapa de verificação passa a usar `atividade_pos_venda_id` em vez de `client_id`.

---

### 2. `src/components/aula-zero/AulaZeroDrawer.tsx` (linhas 113-138)

**O que faz hoje:** Após salvar dados da aula inaugural, busca o `client_id` na `aulas_inaugurais` e usa para encontrar o aluno na tabela `alunos` e sincronizar os campos pedagógicos.

**Mudança:** Usar `atividade_pos_venda_id` (já existe na `aulas_inaugurais`) para localizar o aluno.

```
// DE:
.select('client_id, atividade_pos_venda_id')
if (aulaInaugural?.client_id) {
  .eq('client_id', aulaInaugural.client_id)

// PARA:
.select('atividade_pos_venda_id')
if (aulaInaugural?.atividade_pos_venda_id) {
  .eq('atividade_pos_venda_id', aulaInaugural.atividade_pos_venda_id)
```

**Impacto:** Nenhum impacto funcional. O `atividade_pos_venda_id` já é campo obrigatório na `aulas_inaugurais`.

---

### 3. `src/components/painel-administrativo/DadosFinaisForm.tsx`

**3 pontos de mudança:**

- **Linha 289:** Ao desvincular aluno, remove `client_id` e `atividade_pos_venda_id`. → Remover `client_id: null` do update, manter só `atividade_pos_venda_id: null`.

- **Linha 303:** Ao vincular novo aluno, grava `client_id` e `atividade_pos_venda_id`. → Remover `client_id: cliente.id` do objeto.

- **Linhas 374 e 402:** Ao criar `eventos_professor` e `aulas_inaugurais`, passa `client_id`. → Essas tabelas **têm sua própria coluna `client_id`** (referência ao CRM, não ao aluno). **Manter como está** — não faz parte da tabela `alunos`.

**Impacto:** Nenhum impacto funcional. O vínculo aluno↔atividade já usa `atividade_pos_venda_id`.

---

### 4. Migração SQL

Após as alterações no código:
- `DROP INDEX IF EXISTS idx_alunos_client_id;`
- `ALTER TABLE alunos DROP COLUMN IF EXISTS client_id;`

---

### Resumo

| Arquivo | Ação | Risco |
|---------|------|-------|
| `use-comissoes.ts` | Trocar busca por `atividade_pos_venda_id` | Zero |
| `AulaZeroDrawer.tsx` | Trocar busca por `atividade_pos_venda_id` | Zero |
| `DadosFinaisForm.tsx` | Remover `client_id` dos updates de `alunos` | Zero |
| Migração SQL | Drop index + drop column | Irreversível |


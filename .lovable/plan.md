
# Plano: Adicionar Vinculação de Aluno no Formulário de Dados Iniciais

## Resumo
Adicionar uma seção no formulário de "Dados Iniciais" para vincular a venda (client) a um aluno existente no sistema, posicionada antes do checkbox "Adicionar Grupo Whatsapp". O dropdown mostrará apenas alunos que ainda não possuem vínculo com nenhuma venda.

---

## Etapas de Implementação

### 1. Migração do Banco de Dados
Criar uma nova coluna na tabela `alunos` para armazenar o vínculo com o client:

```sql
ALTER TABLE public.alunos 
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id);

-- Índice para busca rápida de alunos sem vínculo
CREATE INDEX IF NOT EXISTS idx_alunos_client_id ON public.alunos(client_id);
```

### 2. Atualizar o Formulário DadosFinaisForm
Modificar `src/components/painel-administrativo/DadosFinaisForm.tsx`:

- Adicionar estado para:
  - Filtro de busca por nome
  - Aluno selecionado
  - Lista de alunos disponíveis (sem vínculo)

- Criar nova seção antes do checkbox "Adicionar Grupo Whatsapp":
  - Campo de input para filtrar por nome
  - Dropdown com lista de alunos sem vínculo
  - Exibição do aluno selecionado (se houver)

- Atualizar lógica de salvamento:
  - Ao salvar, atualizar a coluna `client_id` na tabela `alunos`

### 3. Criar Hook para Alunos Sem Vínculo
Criar `src/hooks/use-alunos-sem-vinculo.ts`:

```typescript
// Buscar alunos ativos que não possuem client_id preenchido
// OU que já estão vinculados ao client atual (para edição)
const { data } = await supabase
  .from("alunos")
  .select("id, nome, turma_id")
  .eq("active", true)
  .or(`client_id.is.null,client_id.eq.${currentClientId}`)
  .order("nome");
```

### 4. Layout da Seção de Vinculação

```text
+------------------------------------------+
|  Vincular Aluno                          |
|  ----------------------------------------|
|  [Input: Filtrar por nome              ] |
|                                          |
|  [Dropdown: Selecione um aluno        v] |
|  - João Silva (Turma A)                  |
|  - Maria Santos (Turma B)                |
|  - ...                                   |
|                                          |
|  Aluno vinculado: João Silva             |
+------------------------------------------+
```

### 5. Atualizar Validação de Completude
Modificar `src/hooks/use-pos-matricula.ts`:

- Adicionar verificação se existe um aluno vinculado
- A seção "Dados Iniciais" só estará completa quando:
  - Todos os checkboxes estiverem marcados
  - Um aluno estiver vinculado

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/migrations/` | Nova migração para coluna `client_id` |
| `src/components/painel-administrativo/DadosFinaisForm.tsx` | Adicionar seção de vinculação |
| `src/hooks/use-pos-matricula.ts` | Atualizar validação de completude |
| `src/hooks/use-alunos-sem-vinculo.ts` | Novo hook (criar) |
| `src/integrations/supabase/types.ts` | Tipos atualizados automaticamente |

---

## Detalhes Técnicos

### Estrutura do Dropdown
- Usar componente `Select` do shadcn/ui
- Incluir campo de busca integrado (usar `Command` ou filtro manual)
- Mostrar nome do aluno e turma para facilitar identificação

### Fluxo de Dados
1. Ao abrir o formulário, carregar alunos sem vínculo + aluno atualmente vinculado
2. Permitir busca por nome no input
3. Ao selecionar aluno no dropdown, armazenar no estado
4. Ao salvar, fazer UPDATE na tabela `alunos` com o `client_id`

### Considerações
- Se o client já tinha um aluno vinculado e mudar para outro, o antigo perde o vínculo (client_id = null)
- Alunos com is_funcionario = true também podem ser vinculados
- Filtrar por unit_id para mostrar apenas alunos da mesma unidade (se aplicável)

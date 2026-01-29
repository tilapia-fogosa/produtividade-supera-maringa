# Plano de Migração para Sistema Multi-Unidades

## Visão Geral

Este documento descreve as tarefas necessárias para migrar o sistema SUPERA para suportar múltiplas unidades de forma completa e consistente.

---

## Análise do Estado Atual

### ✅ Tabelas que JÁ possuem `unit_id`:
| Tabela | Status | Observações |
|--------|--------|-------------|
| `alunos` | ✅ OK | Possui `unit_id` NOT NULL (FK para units) |
| `professores` | ✅ OK | Possui `unit_id` NOT NULL (FK para units) |
| `funcionarios` | ✅ OK | Possui `unit_id` NOT NULL (FK para units) |
| `turmas` | ✅ OK | Possui `unit_id` NOT NULL |

### ❌ Tabelas que NÃO possuem `unit_id` (problema identificado):
| Tabela | Status | Ação Necessária |
|--------|--------|-----------------|
| `produtividade_abaco` | ❌ Faltando | Adicionar `unit_id` |
| `produtividade_ah` | ❌ Faltando | Adicionar `unit_id` |

### Contexto de Unidades:
- Sistema já possui `ActiveUnitContext` para gerenciar unidade ativa
- Componente `UnitSelector` para trocar entre unidades
- Tabela `units` com 17+ unidades ativas
- Relação usuário-unidades via `profiles.unit_ids`

---

## Fase 1: Tabelas de Produtividade (Prioridade Alta)

### 1.1 Adicionar `unit_id` na tabela `produtividade_abaco`

**Problema**: A tabela não possui referência à unidade, impossibilitando filtrar dados por unidade.

**Solução SQL**:
```sql
-- Passo 1: Adicionar coluna (nullable inicialmente)
ALTER TABLE public.produtividade_abaco 
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units(id);

-- Passo 2: Preencher unit_id baseado no aluno/funcionário vinculado
UPDATE public.produtividade_abaco pa
SET unit_id = (
  SELECT COALESCE(
    (SELECT unit_id FROM public.alunos WHERE id = pa.pessoa_id),
    (SELECT unit_id FROM public.funcionarios WHERE id = pa.pessoa_id)
  )
)
WHERE pa.unit_id IS NULL;

-- Passo 3: Verificar se todos os registros foram preenchidos
SELECT COUNT(*) as registros_sem_unit_id 
FROM public.produtividade_abaco 
WHERE unit_id IS NULL;

-- Passo 4: Após confirmação de dados preenchidos, tornar NOT NULL
ALTER TABLE public.produtividade_abaco 
ALTER COLUMN unit_id SET NOT NULL;

-- Passo 5: Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_produtividade_abaco_unit_id 
ON public.produtividade_abaco(unit_id);
```

### 1.2 Adicionar `unit_id` na tabela `produtividade_ah`

**Solução SQL**:
```sql
-- Passo 1: Adicionar coluna (nullable inicialmente)
ALTER TABLE public.produtividade_ah 
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units(id);

-- Passo 2: Preencher unit_id baseado no aluno/funcionário vinculado
UPDATE public.produtividade_ah pa
SET unit_id = (
  SELECT COALESCE(
    (SELECT unit_id FROM public.alunos WHERE id = pa.pessoa_id),
    (SELECT unit_id FROM public.funcionarios WHERE id = pa.pessoa_id)
  )
)
WHERE pa.unit_id IS NULL;

-- Passo 3: Verificar se todos os registros foram preenchidos
SELECT COUNT(*) as registros_sem_unit_id 
FROM public.produtividade_ah 
WHERE unit_id IS NULL;

-- Passo 4: Após confirmação de dados preenchidos, tornar NOT NULL
ALTER TABLE public.produtividade_ah 
ALTER COLUMN unit_id SET NOT NULL;

-- Passo 5: Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_produtividade_ah_unit_id 
ON public.produtividade_ah(unit_id);
```

---

## Fase 2: Atualização de Código (Frontend/Backend)

### 2.1 Hook `use-produtividade.ts`
- [ ] Modificar funções para incluir `unit_id` ao inserir registros
- [ ] Adicionar filtro por `unit_id` nas queries de busca
- [ ] Usar `activeUnit` do contexto

### 2.2 Edge Function `register-productivity`
- [ ] Receber `unit_id` nos dados de entrada (via `types.ts`)
- [ ] Incluir `unit_id` ao salvar em `produtividade_abaco` (via `database-service.ts`)
- [ ] Buscar `unit_id` do aluno/funcionário se não fornecido

**Arquivo**: `supabase/functions/register-productivity/types.ts`
```typescript
export interface ProdutividadeData {
  // ... campos existentes ...
  unit_id?: string; // Adicionar este campo
}
```

**Arquivo**: `supabase/functions/register-productivity/database-service.ts`
```typescript
// Na função registrarProdutividade, adicionar:
const produtividadeData = {
  // ... campos existentes ...
  unit_id: data.unit_id || pessoa.unit_id, // Usar unit_id do request ou do aluno
};
```

### 2.3 Modal `ProdutividadeModal.tsx`
- [ ] Passar `unit_id` da turma ou aluno ao registrar produtividade

### 2.4 Hooks de consulta de produtividade
- [ ] `use-aluno-progresso.ts`: Filtrar por unidade ativa
- [ ] `use-devolutivas.ts`: Filtrar por unidade ativa

---

## Fase 3: Tabelas `alunos` e `professores` (Verificação)

### 3.1 Tabela `alunos` - Status: ✅ OK
- Já possui `unit_id` NOT NULL
- Já possui FK para `units`
- Todos os alunos ativos possuem unidade definida

### 3.2 Tabela `professores` - Status: ✅ OK
- Já possui `unit_id` NOT NULL
- Já possui FK para `units`

### 3.3 Verificações Necessárias
- [ ] Confirmar que todas as queries de alunos filtram por `unit_id`
- [ ] Confirmar que todas as queries de professores filtram por `unit_id`
- [ ] Revisar hooks: `use-alunos.tsx`, `use-professores.ts`

---

## Fase 4: Outras Tabelas Relacionadas (Fase Futura)

Tabelas que também precisarão de `unit_id` ou revisão:

| Tabela | Prioridade | Observação |
|--------|------------|------------|
| `ah_recolhidas` | Média | Relacionado a AH |
| `ah_ignorar_coleta` | Média | Relacionado a AH |
| `alerta_evasao` | Média | Alertas por unidade |
| `alertas_falta` | ✅ OK | Já possui `unit_id` |
| `alertas_lancamento` | Baixa | Verificar necessidade |
| `pendencias_botom` | Baixa | Verificar necessidade |

---

## Checklist de Tarefas

### 📦 Banco de Dados
- [ ] Adicionar `unit_id` em `produtividade_abaco`
- [ ] Popular dados existentes de `produtividade_abaco` com unit_id
- [ ] Tornar `unit_id` NOT NULL em `produtividade_abaco`
- [ ] Adicionar `unit_id` em `produtividade_ah`
- [ ] Popular dados existentes de `produtividade_ah` com unit_id
- [ ] Tornar `unit_id` NOT NULL em `produtividade_ah`
- [ ] Criar índices de performance

### 🖥️ Frontend
- [ ] Atualizar `use-produtividade.ts` para enviar/filtrar por unit_id
- [ ] Atualizar `ProdutividadeModal.tsx` para incluir unit_id
- [ ] Atualizar `use-aluno-progresso.ts` para filtrar por unit_id
- [ ] Revisar `use-alunos.tsx` para garantir filtro por unidade
- [ ] Revisar `use-professores.ts` para garantir filtro por unidade

### ⚡ Backend (Edge Functions)
- [ ] Atualizar `register-productivity/types.ts` para incluir unit_id
- [ ] Atualizar `register-productivity/database-service.ts` para salvar unit_id

### 🧪 Testes
- [ ] Testar registro de produtividade com unidades diferentes
- [ ] Testar consultas filtrando por unidade ativa
- [ ] Testar troca de unidade no seletor

---

## Detalhes Técnicos

### Estrutura Atual da Tabela `produtividade_abaco`

| Coluna | Tipo | Nullable | Observação |
|--------|------|----------|------------|
| id | uuid | NOT NULL | PK |
| pessoa_id | uuid | NOT NULL | FK para alunos/funcionarios |
| data_aula | date | NOT NULL | |
| presente | boolean | NOT NULL | |
| is_reposicao | boolean | NOT NULL | |
| apostila | text | YES | |
| pagina | text | YES | |
| exercicios | integer | YES | |
| erros | integer | YES | |
| fez_desafio | boolean | YES | |
| comentario | text | YES | |
| tipo_pessoa | text | YES | |
| motivo_falta | text | YES | |
| aluno_nome | text | YES | |
| funcionario_registro_id | uuid | YES | |
| **unit_id** | **uuid** | **FALTANDO** | **Adicionar** |

### Estrutura Atual da Tabela `produtividade_ah`

| Coluna | Tipo | Nullable | Observação |
|--------|------|----------|------------|
| id | uuid | NOT NULL | PK |
| pessoa_id | uuid | NOT NULL | FK para alunos/funcionarios |
| apostila | text | YES | |
| exercicios | integer | YES | |
| erros | integer | YES | |
| professor_correcao | text | YES | |
| comentario | text | YES | |
| tipo_pessoa | text | NOT NULL | |
| aluno_nome | text | YES | |
| data_fim_correcao | timestamptz | YES | |
| ah_recolhida_id | integer | YES | |
| funcionario_registro_id | uuid | YES | |
| **unit_id** | **uuid** | **FALTANDO** | **Adicionar** |

---

## Próximos Passos

1. ✅ **Criar este documento de plano**
2. ⏳ **Executar migrations** para adicionar colunas `unit_id`
3. ⏳ **Atualizar código frontend e backend** para usar `unit_id`
4. ⏳ **Testar em ambiente de desenvolvimento** antes de produção

---

## Histórico de Alterações

| Data | Descrição |
|------|-----------|
| 2025-01-29 | Documento criado com plano inicial |

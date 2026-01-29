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

## Fase 5: Tela Home (Dashboard) - Análise Detalhada

### 5.1 Visão Geral da Arquitetura

A tela Home é uma **agregação de 13+ fontes de dados** diferentes, não uma tabela única. Os dados são carregados dinamicamente baseados no perfil do usuário (Professor vs Administrativo).

**Componentes principais:**
- `src/pages/Home.tsx` - Componente principal
- Múltiplos hooks para buscar dados de diferentes tabelas

---

### 5.2 Tabelas Envolvidas na Home

| Tabela | Uso na Home | Status unit_id | Ação |
|--------|-------------|----------------|------|
| `tarefas_pessoais` | Tarefas do usuário | ⚠️ Verificar | Analisar |
| `alunos` | Aniversariantes, camisetas, coletas | ✅ OK | - |
| `funcionarios` | Aniversariantes funcionários | ✅ OK | - |
| `camisetas` | Entregas pendentes | ❌ Não possui | Adicionar |
| `ah_recolhidas` | Apostilas para entregar | ❌ Não possui | Adicionar |
| `eventos_professor` | Aulas inaugurais | ⚠️ Verificar | Analisar |
| `alerta_evasao` | Alertas de evasão | ❌ Não possui | Adicionar |
| `atividades_alerta_evasao` | Atividades pendentes | ❌ Não possui | Adicionar |
| `pos_venda_dados` | Pós-matrículas incompletas | ⚠️ Verificar | Analisar |
| `reposicoes` (RPC) | Reposições do dia | ⚠️ Verificar | Analisar |
| `aulas_experimentais` (RPC) | Aulas experimentais | ⚠️ Verificar | Analisar |
| `pendencias_botom` | Entregas de botom | ⚠️ Verificar | Analisar |

---

### 5.3 Hooks que Precisam de Correção

| Hook | Arquivo | Problema | Ação Necessária |
|------|---------|----------|-----------------|
| `useCamisetas` | `use-camisetas.ts` | Não filtra por unidade | Adicionar filtro unit_id via join com alunos |
| `useProximasColetasAH` | `use-proximas-coletas-ah.ts` | Busca todos alunos/funcionários ativos | Filtrar por activeUnit |
| `useApostilasRecolhidas` | `use-apostilas-recolhidas.ts` | Não filtra por unidade | Adicionar filtro unit_id via join |
| `useAtividadesEvasaoHome` | `use-atividades-evasao-home.ts` | Não filtra por unidade | Adicionar filtro unit_id |
| `useAulasInauguraisProfessor` | `use-aulas-inaugurais-professor.ts` | Não filtra por unidade | Adicionar filtro unit_id |
| `useProfessorAtividades` | `use-professor-atividades.ts` | Busca turmas sem filtro de unidade | Filtrar turmas por activeUnit |

---

### 5.4 Hooks que já Suportam Multi-Unidades ✅

| Hook | Arquivo | Como filtra |
|------|---------|-------------|
| `useAniversariantes` | `use-aniversariantes.ts` | Filtra por unit_id diretamente |
| `usePosMatriculasIncompletas` | `use-pos-matriculas-incompletas.ts` | Filtra via aluno.unit_id |
| RPC `get_lista_aulas_experimentais` | - | Recebe unit_id como parâmetro |
| RPC `get_lista_completa_reposicoes` | - | Recebe unit_id como parâmetro |

---

### 5.5 SQL para Adicionar unit_id nas Tabelas da Home

#### 5.5.1 Tabela `camisetas`
```sql
-- Adicionar coluna
ALTER TABLE public.camisetas 
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units(id);

-- Popular baseado no aluno
UPDATE public.camisetas c
SET unit_id = (SELECT unit_id FROM public.alunos WHERE id = c.aluno_id)
WHERE c.unit_id IS NULL;

-- Tornar NOT NULL após verificação
ALTER TABLE public.camisetas 
ALTER COLUMN unit_id SET NOT NULL;

-- Índice
CREATE INDEX IF NOT EXISTS idx_camisetas_unit_id ON public.camisetas(unit_id);
```

#### 5.5.2 Tabela `ah_recolhidas`
```sql
-- Adicionar coluna
ALTER TABLE public.ah_recolhidas 
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units(id);

-- Popular baseado no aluno/funcionário
UPDATE public.ah_recolhidas ar
SET unit_id = (
  SELECT COALESCE(
    (SELECT unit_id FROM public.alunos WHERE id = ar.pessoa_id),
    (SELECT unit_id FROM public.funcionarios WHERE id = ar.pessoa_id)
  )
)
WHERE ar.unit_id IS NULL;

-- Tornar NOT NULL após verificação
ALTER TABLE public.ah_recolhidas 
ALTER COLUMN unit_id SET NOT NULL;

-- Índice
CREATE INDEX IF NOT EXISTS idx_ah_recolhidas_unit_id ON public.ah_recolhidas(unit_id);
```

#### 5.5.3 Tabela `alerta_evasao`
```sql
-- Adicionar coluna
ALTER TABLE public.alerta_evasao 
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units(id);

-- Popular baseado no aluno
UPDATE public.alerta_evasao ae
SET unit_id = (SELECT unit_id FROM public.alunos WHERE id = ae.aluno_id)
WHERE ae.unit_id IS NULL;

-- Tornar NOT NULL após verificação
ALTER TABLE public.alerta_evasao 
ALTER COLUMN unit_id SET NOT NULL;

-- Índice
CREATE INDEX IF NOT EXISTS idx_alerta_evasao_unit_id ON public.alerta_evasao(unit_id);
```

#### 5.5.4 Tabela `atividades_alerta_evasao`
```sql
-- Adicionar coluna
ALTER TABLE public.atividades_alerta_evasao 
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units(id);

-- Popular baseado no alerta pai
UPDATE public.atividades_alerta_evasao aae
SET unit_id = (
  SELECT ae.unit_id 
  FROM public.alerta_evasao ae 
  WHERE ae.id = aae.alerta_id
)
WHERE aae.unit_id IS NULL;

-- Tornar NOT NULL após verificação
ALTER TABLE public.atividades_alerta_evasao 
ALTER COLUMN unit_id SET NOT NULL;

-- Índice
CREATE INDEX IF NOT EXISTS idx_atividades_alerta_evasao_unit_id 
ON public.atividades_alerta_evasao(unit_id);
```

---

### 5.6 Checklist de Tarefas - Tela Home

#### Banco de Dados
- [ ] Adicionar `unit_id` na tabela `camisetas`
- [ ] Popular dados existentes de `camisetas` com unit_id
- [ ] Adicionar `unit_id` na tabela `ah_recolhidas`
- [ ] Popular dados existentes de `ah_recolhidas` com unit_id
- [ ] Adicionar `unit_id` na tabela `alerta_evasao`
- [ ] Popular dados existentes de `alerta_evasao` com unit_id
- [ ] Adicionar `unit_id` na tabela `atividades_alerta_evasao`
- [ ] Popular dados existentes de `atividades_alerta_evasao` com unit_id

#### Frontend (Hooks)
- [ ] Atualizar `use-camisetas.ts` para filtrar por unidade ativa
- [ ] Atualizar `use-proximas-coletas-ah.ts` para usar activeUnit
- [ ] Atualizar `use-apostilas-recolhidas.ts` para filtrar por unidade
- [ ] Atualizar `use-atividades-evasao-home.ts` para filtrar por unidade
- [ ] Atualizar `use-aulas-inaugurais-professor.ts` para filtrar por unidade
- [ ] Atualizar `use-professor-atividades.ts` para filtrar turmas por unidade

---

## Próximos Passos

1. ✅ **Criar este documento de plano**
2. ✅ **Documentar análise da tela Home**
3. ⏳ **Executar migrations** para adicionar colunas `unit_id`
4. ⏳ **Atualizar código frontend e backend** para usar `unit_id`
5. ⏳ **Testar em ambiente de desenvolvimento** antes de produção

---

## Histórico de Alterações

| Data | Descrição |
|------|-----------|
| 2025-01-29 | Documento criado com plano inicial |
| 2025-01-29 | Adicionada análise detalhada da tela Home (Fase 5) |

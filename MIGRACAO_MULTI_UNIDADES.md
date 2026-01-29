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

### ✅ Tabelas de Produtividade - Isolamento Herdado (Implementado por Design):
| Tabela | Status | Observações |
|--------|--------|-------------|
| `produtividade_abaco` | ✅ OK | Herda `unit_id` via `pessoa_id` → `alunos/funcionarios` |
| `produtividade_ah` | ✅ OK | Herda `unit_id` via `pessoa_id` → `alunos/funcionarios` |

**Justificativa Técnica:**
- Ambas as tabelas herdam o isolamento multi-unidades através do vínculo com `pessoa_id`
- As políticas RLS já fazem JOIN para verificar acesso via `user_has_access_to_unit(unit_id)`
- Não é necessário adicionar coluna `unit_id` diretamente nestas tabelas

### Contexto de Unidades:
- Sistema já possui `ActiveUnitContext` para gerenciar unidade ativa
- Componente `UnitSelector` para trocar entre unidades
- Tabela `units` com 17+ unidades ativas
- Relação usuário-unidades via `profiles.unit_ids`

---

## Fase 1: Tabelas de Produtividade - ✅ CONCLUÍDA (Implementada por Design)

**Data de Conclusão:** 29/01/2026

### Status: ✅ Implementada por Design

**Análise Realizada:**
Após análise detalhada da arquitetura, foi determinado que as tabelas de produtividade (`produtividade_abaco` e `produtividade_ah`) **NÃO necessitam** de coluna `unit_id` direta.

### Justificativa Técnica:

1. **Herança de Isolamento:** Ambas as tabelas vinculam registros a um `pessoa_id` (aluno ou funcionário), que já possui `unit_id` obrigatório.

2. **Arquitetura de Isolamento:**
```
produtividade_abaco/ah
        │
        └── pessoa_id ──► alunos/funcionarios
                                │
                                └── unit_id ──► units
```

3. **Políticas RLS Existentes:** As políticas já verificam o acesso através de JOIN:
```sql
EXISTS (
  SELECT 1 FROM alunos a 
  WHERE a.id = produtividade_abaco.pessoa_id 
  AND user_has_access_to_unit(a.unit_id)
)
OR EXISTS (
  SELECT 1 FROM funcionarios f 
  WHERE f.id = produtividade_abaco.pessoa_id 
  AND user_has_access_to_unit(f.unit_id)
)
```

4. **RLS Habilitado:** 
   - `produtividade_abaco`: RLS habilitado ✅
   - `produtividade_ah`: RLS habilitado em 29/01/2026 ✅

### Ações Realizadas:
- [x] Análise de arquitetura para validar herança de isolamento
- [x] Confirmação de políticas RLS existentes
- [x] Habilitação de RLS na tabela `produtividade_ah` (estava desabilitado)

### Benefícios desta Abordagem:
- Evita duplicação de dados (`unit_id` em múltiplas tabelas)
- Mantém consistência automática (se aluno mudar de unidade, histórico segue)
- Reduz complexidade de migrations e manutenção
- Políticas RLS já implementadas corretamente

---

## Fase 2: Atualização de Código (Produtividade) - ✅ CONCLUÍDA (Desnecessária)

**Data de Conclusão:** 29/01/2026

### Status: ✅ Desnecessária - Isolamento já funcional

**Análise Realizada:**
Com a confirmação de que as tabelas de produtividade herdam isolamento via `pessoa_id`, as alterações de código propostas **não são necessárias** para CRUD de produtividade.

### Por que não precisa alterar:

| Componente | Situação Atual | Necessita Alteração? |
|------------|----------------|---------------------|
| `use-produtividade.ts` | Filtra por `pessoa_id` | ❌ Não - RLS já protege |
| Edge Function `register-productivity` | Recebe `pessoa_id` | ❌ Não - Pessoa já tem unit_id |
| `ProdutividadeModal.tsx` | Usa aluno selecionado | ❌ Não - Aluno já tem unit_id |
| `use-aluno-progresso.ts` | Busca por `pessoa_id` | ❌ Não - RLS já filtra |

### Comportamento Atual (já correto):
1. Usuário seleciona aluno/turma (já filtrado por unidade via RLS)
2. Registra produtividade vinculada ao `pessoa_id`
3. Consultas subsequentes são protegidas por RLS via JOIN com alunos/funcionarios

### Observação:
Caso no futuro seja necessário **relatórios agregados de produtividade por unidade** (sem passar pelo aluno), pode-se considerar adicionar `unit_id` para otimização de queries. Por ora, não há necessidade.

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

## Fase 6: Tela Sincronizar Turmas - Análise Detalhada

### 6.1 Visão Geral da Arquitetura

A tela de Sincronizar Turmas é responsável por importar dados de turmas, professores e alunos via arquivo Excel. Atualmente usa unit_id fixo de Maringá em toda a lógica de sincronização.

**Arquivos principais:**
| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/pages/SincronizarTurmas.tsx` | Frontend | Página principal da sincronização |
| `src/components/sync/XlsUploadComponent.tsx` | Frontend | Componente de upload e processamento |
| `src/hooks/use-ultima-sincronizacao.ts` | Hook | Busca histórico de sincronizações |
| `supabase/functions/sync-turmas-xls/index.ts` | Edge Function | Processa dados e salva no banco |

---

### 6.2 Problema Atual

| Componente | Problema | Impacto |
|------------|----------|---------|
| Edge Function | Unit ID fixo (`0df79a04-444e-46ee-b218-59e4b1835f4a`) | Todos os dados sincronizam apenas para Maringá |
| XlsUploadComponent | Não envia `unit_id` para backend | Impossibilita sincronizar para outras unidades |
| use-ultima-sincronizacao | Não filtra por unidade | Histórico mostra sincronizações de todas as unidades |

**Código problemático na Edge Function:**
```typescript
// supabase/functions/sync-turmas-xls/index.ts (linha ~42)
const MARINGA_UNIT_ID = '0df79a04-444e-46ee-b218-59e4b1835f4a';
```

---

### 6.3 Solução Proposta

**Regra de Negócio:**
- Usuário com 1 unidade: sincroniza automaticamente para ela
- Usuário com múltiplas unidades: escolhe para qual unidade sincronizar

**Fluxo proposto:**
```
[Usuário abre tela] → [Sistema detecta unidades do usuário]
                              ↓
              [1 unidade] → Exibe nome da unidade no cabeçalho
              [N unidades] → Exibe seletor de unidade
                              ↓
[Upload do arquivo] → [Envia unitId para Edge Function]
                              ↓
[Edge Function] → Valida unitId → Processa dados para unidade correta
```

---

### 6.4 Alterações no Frontend

#### 6.4.1 Arquivo: `src/components/sync/XlsUploadComponent.tsx`

**Alterações necessárias:**
- [ ] Importar `useActiveUnit` do contexto
- [ ] Exibir nome da unidade ativa no cabeçalho do card
- [ ] Passar `unitId` no body da chamada da Edge Function
- [ ] Atualizar texto do botão para incluir nome da unidade

**Código atual:**
```typescript
const { data, error } = await supabase.functions.invoke('sync-turmas-xls', {
  body: { xlsData: parsedData, fileName: file.name }
});
```

**Código novo:**
```typescript
const { activeUnit } = useActiveUnit();

const { data, error } = await supabase.functions.invoke('sync-turmas-xls', {
  body: { 
    xlsData: parsedData, 
    fileName: file.name,
    unitId: activeUnit?.id  // Adicionar unitId
  }
});
```

**Interface proposta:**
```
+-------------------------------------------+
|  Importar Excel                           |
|  Sincronizando para: Maringá              |
+-------------------------------------------+
|  [Selecionar Excel]  [Baixar Template]    |
|                                           |
|  Arquivo: turmas-2024.xlsx                |
|  +-------+  +-------+  +-------+          |
|  |Turmas |  |Profs  |  |Alunos |          |
|  |  15   |  |   8   |  |  120  |          |
|  +-------+  +-------+  +-------+          |
|                                           |
|  [    Sincronizar para Maringá    ]       |
+-------------------------------------------+
```

#### 6.4.2 Arquivo: `src/pages/SincronizarTurmas.tsx`

**Alterações necessárias:**
- [ ] Exibir unidade ativa no cabeçalho da página
- [ ] Passar `unitId` para o hook de histórico

#### 6.4.3 Arquivo: `src/hooks/use-ultima-sincronizacao.ts`

**Alterações necessárias:**
- [ ] Adicionar parâmetro `unitId`
- [ ] Filtrar por `unit_id` na query
- [ ] Atualizar `queryKey` para incluir unitId

**Código atual:**
```typescript
export const useUltimaSincronizacao = () => {
  return useQuery({
    queryKey: ["ultimas-sincronizacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_imports')
        .select('*')
        .eq('import_type', 'turmas-xls')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);
      // ...
    },
  });
};
```

**Código novo:**
```typescript
export const useUltimaSincronizacao = (unitId?: string) => {
  return useQuery({
    queryKey: ["ultimas-sincronizacoes", unitId],
    queryFn: async () => {
      let query = supabase
        .from('data_imports')
        .select('*')
        .eq('import_type', 'turmas-xls')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (unitId) {
        query = query.eq('unit_id', unitId);
      }
      
      const { data, error } = await query;
      // ...
    },
    enabled: !!unitId, // Só executa se tiver unitId
  });
};
```

---

### 6.5 Alterações na Edge Function

#### Arquivo: `supabase/functions/sync-turmas-xls/index.ts`

**Alterações necessárias:**
- [ ] Remover constante `MARINGA_UNIT_ID` fixa
- [ ] Receber `unitId` do body da requisição
- [ ] Validar presença do `unitId` (campo obrigatório)
- [ ] Substituir todas ocorrências de `MARINGA_UNIT_ID` por `unitId`

**Código atual (linha ~39-42):**
```typescript
const { xlsData, fileName }: { xlsData: XlsData; fileName: string } = await req.json();

// Unit ID fixo da unidade de Maringá
const MARINGA_UNIT_ID = '0df79a04-444e-46ee-b218-59e4b1835f4a';
```

**Código novo:**
```typescript
const { xlsData, fileName, unitId }: { 
  xlsData: XlsData; 
  fileName: string; 
  unitId: string;
} = await req.json();

// Validar unitId obrigatório
if (!unitId) {
  return new Response(
    JSON.stringify({ error: 'unitId é obrigatório' }),
    { headers: corsHeaders, status: 400 }
  );
}

console.log(`Sincronizando para unidade: ${unitId}`);
```

**Locais onde MARINGA_UNIT_ID é usado (trocar por unitId):**
- Linha 42: Definição da constante
- Linha 57: Inserção no `data_imports`
- Linha 107: Desativar professores
- Linha 117: Desativar turmas
- Linha 127: Desativar alunos
- Linha 163: Buscar professor existente na unidade
- Linha 185-191: Mover/atualizar professor
- Linha 229: Criar novo professor
- Linha 271-272: Buscar professor por nome na unidade
- Linha 314-315: Buscar turma existente
- Linha 354: Criar nova turma
- Linha 398-400: Buscar turma para aluno
- Linha 423-425: Buscar aluno existente
- Linha 473: Criar novo aluno
- Linha 521: Buscar alunos ativos para webhook

---

### 6.6 Banco de Dados

A tabela `data_imports` já possui a coluna `unit_id` (NOT NULL), portanto **não é necessária migração de banco de dados** para esta funcionalidade.

**Estrutura atual da tabela `data_imports`:**
| Coluna | Tipo | Nullable | Observação |
|--------|------|----------|------------|
| id | uuid | NOT NULL | PK |
| import_type | text | NOT NULL | Tipo de importação |
| file_name | text | YES | Nome do arquivo |
| status | text | NOT NULL | processing, completed, failed |
| **unit_id** | **uuid** | **NOT NULL** | ✅ Já existe |
| total_rows | integer | YES | Total de registros |
| processed_rows | integer | YES | Registros processados |
| error_log | jsonb | YES | Log de erros |
| created_at | timestamptz | NOT NULL | Data criação |

---

### 6.7 Checklist de Tarefas - Tela Sincronizar Turmas

#### Frontend
- [ ] Atualizar `XlsUploadComponent.tsx`:
  - [ ] Importar `useActiveUnit`
  - [ ] Exibir unidade ativa no cabeçalho do card
  - [ ] Passar `unitId` no body do `supabase.functions.invoke`
  - [ ] Atualizar texto do botão com nome da unidade

- [ ] Atualizar `SincronizarTurmas.tsx`:
  - [ ] Exibir unidade ativa no cabeçalho da página
  - [ ] Passar `unitId` para hook de histórico

- [ ] Atualizar `use-ultima-sincronizacao.ts`:
  - [ ] Adicionar parâmetro `unitId`
  - [ ] Filtrar por `unit_id` na query
  - [ ] Atualizar `queryKey` com unitId

#### Backend (Edge Function)
- [ ] Atualizar `sync-turmas-xls/index.ts`:
  - [ ] Remover constante `MARINGA_UNIT_ID`
  - [ ] Receber `unitId` do body
  - [ ] Validar presença do `unitId`
  - [ ] Substituir todas 15+ ocorrências de `MARINGA_UNIT_ID` por `unitId`

#### Testes
- [ ] Testar sincronização com usuário de 1 unidade
- [ ] Testar sincronização com usuário de múltiplas unidades
- [ ] Verificar que histórico filtra por unidade correta
- [ ] Verificar que dados são salvos com unit_id correto
- [ ] Verificar que webhook envia alunos da unidade correta

---

## Fase 7: Tela Calendário de Aulas - Análise Detalhada

### 7.1 Visão Geral da Arquitetura

A tela de Calendário de Aulas exibe um grid semanal com turmas e eventos de sala. Possui modais auxiliares para listar reposições, aulas experimentais e faltas futuras.

**Arquivos principais:**
| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/pages/CalendarioAulas.tsx` | Frontend | Página principal do calendário |
| `src/hooks/use-calendario-eventos-unificados.ts` | Hook | Busca eventos unificados |
| `src/hooks/use-lista-reposicoes.ts` | Hook | Lista de reposições |
| `src/hooks/use-lista-aulas-experimentais.ts` | Hook | Lista de aulas experimentais |
| `src/hooks/use-lista-faltas-futuras.ts` | Hook | Lista de faltas futuras |
| `src/components/turmas/ListaReposicoesModal.tsx` | Modal | Modal de reposições |
| `src/components/turmas/ListaAulasExperimentaisModal.tsx` | Modal | Modal de aulas experimentais |
| `src/components/turmas/ListaFaltasFuturasModal.tsx` | Modal | Modal de faltas futuras |

---

### 7.2 Status Atual - O que JÁ FUNCIONA

| Componente | Status | Como funciona |
|------------|--------|---------------|
| `CalendarioAulas.tsx` | ✅ OK | Usa `useActiveUnit()` e passa `activeUnit?.id` |
| `useCalendarioEventosUnificados` | ✅ OK | Recebe `unitId` e inclui na queryKey |
| RPC `get_calendario_eventos_unificados` | ✅ OK | Recebe `p_unit_id` e filtra na view |
| View `vw_calendario_eventos_unificados` | ✅ OK | Usa `turmas.unit_id` e `eventos_sala.unit_id` |
| Tabela `turmas` | ✅ OK | Possui `unit_id` NOT NULL |
| Tabela `eventos_sala` | ✅ OK | Possui `unit_id` NOT NULL |
| Tabela `salas` | ✅ OK | Possui `unit_id` NOT NULL |

---

### 7.3 Problema Atual - Modais Auxiliares

Os modais de listagem não filtram por unidade, mostrando dados de todas as unidades:

| Hook | RPC/Query | Problema | Impacto |
|------|-----------|----------|---------|
| `useListaReposicoes` | `get_lista_completa_reposicoes` | Não recebe `unit_id` | Mostra reposições de todas unidades |
| `useListaAulasExperimentais` | `get_lista_aulas_experimentais` | Não recebe `unit_id` | Mostra aulas experimentais de todas unidades |
| `useListaFaltasFuturas` | Query direta `faltas_antecipadas` | Não filtra por `unit_id` | Mostra faltas de todas unidades |

**Observação**: Todas as tabelas (`reposicoes`, `aulas_experimentais`, `faltas_antecipadas`) JÁ possuem `unit_id` NOT NULL.

---

### 7.4 Banco de Dados - Migrações Necessárias

#### 7.4.1 Atualizar RPC `get_lista_completa_reposicoes`

```sql
-- Dropar função existente (sem parâmetros)
DROP FUNCTION IF EXISTS get_lista_completa_reposicoes();

-- Criar nova função com parâmetro p_unit_id
CREATE OR REPLACE FUNCTION get_lista_completa_reposicoes(
  p_unit_id uuid DEFAULT NULL
)
RETURNS TABLE(
  reposicao_id uuid,
  data_reposicao date,
  data_falta date,
  aluno_nome text,
  turma_original_nome text,
  turma_reposicao_nome text,
  turma_reposicao_professor text,
  observacoes text,
  unit_id uuid,
  aluno_id uuid,
  turma_original_id uuid,
  turma_reposicao_id uuid,
  pessoa_tipo text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    r.id as reposicao_id,
    r.data_reposicao,
    r.data_falta,
    COALESCE(a.nome, f.nome, r.aluno_nome) as aluno_nome,
    t_orig.nome as turma_original_nome,
    t_rep.nome as turma_reposicao_nome,
    p.nome as turma_reposicao_professor,
    r.observacoes,
    r.unit_id,
    r.aluno_id,
    r.turma_original_id,
    r.turma_reposicao_id,
    r.pessoa_tipo
  FROM reposicoes r
  LEFT JOIN alunos a ON r.aluno_id = a.id AND r.pessoa_tipo = 'aluno'
  LEFT JOIN funcionarios f ON r.aluno_id = f.id AND r.pessoa_tipo = 'funcionario'
  LEFT JOIN turmas t_orig ON r.turma_original_id = t_orig.id
  LEFT JOIN turmas t_rep ON r.turma_reposicao_id = t_rep.id
  LEFT JOIN professores p ON t_rep.professor_id = p.id
  WHERE r.data_reposicao >= CURRENT_DATE
    AND (p_unit_id IS NULL OR r.unit_id = p_unit_id)
  ORDER BY r.data_reposicao ASC;
END;
$function$;
```

#### 7.4.2 Atualizar RPC `get_lista_aulas_experimentais`

```sql
-- Dropar função existente (sem parâmetros)
DROP FUNCTION IF EXISTS get_lista_aulas_experimentais();

-- Criar nova função com parâmetro p_unit_id
CREATE OR REPLACE FUNCTION get_lista_aulas_experimentais(
  p_unit_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  cliente_nome text,
  cliente_telefone text,
  data_aula_experimental date,
  turma_id uuid,
  turma_nome text,
  professor_nome text,
  observacoes text,
  created_at timestamptz,
  active boolean,
  unit_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ae.id,
    ae.cliente_nome,
    ae.cliente_telefone,
    ae.data_aula_experimental,
    ae.turma_id,
    t.nome as turma_nome,
    p.nome as professor_nome,
    ae.observacoes,
    ae.created_at,
    ae.active,
    ae.unit_id
  FROM aulas_experimentais ae
  LEFT JOIN turmas t ON ae.turma_id = t.id
  LEFT JOIN professores p ON t.professor_id = p.id
  WHERE ae.active = true
    AND (p_unit_id IS NULL OR ae.unit_id = p_unit_id)
  ORDER BY ae.data_aula_experimental DESC, ae.cliente_nome ASC;
END;
$function$;
```

---

### 7.5 Frontend - Alterações Necessárias

#### 7.5.1 Hook `use-lista-reposicoes.ts`

**Alterações:**
- Receber `unitId` como parâmetro
- Passar `p_unit_id` para a RPC
- Incluir `unitId` na queryKey

**Código novo:**
```typescript
export const useListaReposicoes = (unitId?: string) => {
  const { data: reposicoes = [], isLoading, refetch } = useQuery({
    queryKey: ["lista-reposicoes", unitId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_lista_completa_reposicoes", {
        p_unit_id: unitId || null
      });
      if (error) throw error;
      return data || [];
    },
  });

  return { reposicoes, isLoading, refetch };
};
```

#### 7.5.2 Hook `use-lista-aulas-experimentais.ts`

**Alterações:**
- Receber `unitId` como parâmetro
- Passar `p_unit_id` para a RPC
- Incluir `unitId` na queryKey

**Código novo:**
```typescript
export const useListaAulasExperimentais = (unitId?: string) => {
  return useQuery({
    queryKey: ["lista-aulas-experimentais", unitId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_lista_aulas_experimentais", {
        p_unit_id: unitId || null
      });
      if (error) throw error;
      return data || [];
    },
  });
};
```

#### 7.5.3 Hook `use-lista-faltas-futuras.ts`

**Alterações:**
- Receber `unitId` como parâmetro
- Adicionar filtro `.eq('unit_id', unitId)` quando unitId existir
- Incluir `unitId` na queryKey

**Código novo:**
```typescript
export const useListaFaltasFuturas = (unitId?: string) => {
  return useQuery({
    queryKey: ["lista-faltas-futuras", unitId],
    queryFn: async () => {
      let query = supabase
        .from('faltas_antecipadas')
        .select(`
          id,
          data_falta,
          motivo,
          observacoes,
          aluno_id,
          turma_id,
          active,
          unit_id,
          alunos!inner(nome),
          turmas!inner(nome, professores(nome))
        `)
        .eq('active', true);
      
      if (unitId) {
        query = query.eq('unit_id', unitId);
      }
      
      const { data, error } = await query.order('data_falta', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
};
```

#### 7.5.4 Modal `ListaReposicoesModal.tsx`

**Alterações:**
- Adicionar prop `unitId?: string`
- Passar `unitId` para o hook

```typescript
interface ListaReposicoesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitId?: string;
}

export const ListaReposicoesModal = ({ open, onOpenChange, unitId }: ListaReposicoesModalProps) => {
  const { reposicoes, isLoading } = useListaReposicoes(unitId);
  // ... resto do componente
};
```

#### 7.5.5 Modal `ListaAulasExperimentaisModal.tsx`

**Alterações:**
- Adicionar prop `unitId?: string`
- Passar `unitId` para o hook

```typescript
interface ListaAulasExperimentaisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitId?: string;
}

export const ListaAulasExperimentaisModal = ({ open, onOpenChange, unitId }: ListaAulasExperimentaisModalProps) => {
  const { data: aulasExperimentais = [], isLoading } = useListaAulasExperimentais(unitId);
  // ... resto do componente
};
```

#### 7.5.6 Modal `ListaFaltasFuturasModal.tsx`

**Alterações:**
- Adicionar prop `unitId?: string`
- Passar `unitId` para o hook

```typescript
interface ListaFaltasFuturasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitId?: string;
}

export const ListaFaltasFuturasModal = ({ open, onOpenChange, unitId }: ListaFaltasFuturasModalProps) => {
  const { data: faltasFuturas = [], isLoading } = useListaFaltasFuturas(unitId);
  // ... resto do componente
};
```

#### 7.5.7 Página `CalendarioAulas.tsx`

**Alterações:**
- Passar `activeUnit?.id` para cada modal

```typescript
<ListaReposicoesModal
  open={showReposicoesModal}
  onOpenChange={setShowReposicoesModal}
  unitId={activeUnit?.id}
/>

<ListaAulasExperimentaisModal
  open={showAulasExperimentaisModal}
  onOpenChange={setShowAulasExperimentaisModal}
  unitId={activeUnit?.id}
/>

<ListaFaltasFuturasModal
  open={showFaltasFuturasModal}
  onOpenChange={setShowFaltasFuturasModal}
  unitId={activeUnit?.id}
/>
```

---

### 7.6 Checklist de Tarefas - Tela Calendário de Aulas

#### Banco de Dados (RPCs)
- [ ] Atualizar RPC `get_lista_completa_reposicoes`:
  - [ ] Dropar função existente
  - [ ] Criar nova com parâmetro `p_unit_id uuid DEFAULT NULL`
  - [ ] Adicionar filtro `(p_unit_id IS NULL OR r.unit_id = p_unit_id)`

- [ ] Atualizar RPC `get_lista_aulas_experimentais`:
  - [ ] Dropar função existente
  - [ ] Criar nova com parâmetro `p_unit_id uuid DEFAULT NULL`
  - [ ] Adicionar filtro `(p_unit_id IS NULL OR ae.unit_id = p_unit_id)`

#### Frontend (Hooks)
- [ ] Atualizar `use-lista-reposicoes.ts`:
  - [ ] Adicionar parâmetro `unitId?: string`
  - [ ] Passar `p_unit_id` para RPC
  - [ ] Incluir `unitId` na queryKey

- [ ] Atualizar `use-lista-aulas-experimentais.ts`:
  - [ ] Adicionar parâmetro `unitId?: string`
  - [ ] Passar `p_unit_id` para RPC
  - [ ] Incluir `unitId` na queryKey

- [ ] Atualizar `use-lista-faltas-futuras.ts`:
  - [ ] Adicionar parâmetro `unitId?: string`
  - [ ] Adicionar `.eq('unit_id', unitId)` quando unitId existir
  - [ ] Incluir `unitId` na queryKey

#### Frontend (Modais)
- [ ] Atualizar `ListaReposicoesModal.tsx`:
  - [ ] Adicionar prop `unitId?: string`
  - [ ] Passar `unitId` para o hook

- [ ] Atualizar `ListaAulasExperimentaisModal.tsx`:
  - [ ] Adicionar prop `unitId?: string`
  - [ ] Passar `unitId` para o hook

- [ ] Atualizar `ListaFaltasFuturasModal.tsx`:
  - [ ] Adicionar prop `unitId?: string`
  - [ ] Passar `unitId` para o hook

- [ ] Atualizar `CalendarioAulas.tsx`:
  - [ ] Passar `activeUnit?.id` para `ListaReposicoesModal`
  - [ ] Passar `activeUnit?.id` para `ListaAulasExperimentaisModal`
  - [ ] Passar `activeUnit?.id` para `ListaFaltasFuturasModal`

#### Testes
- [ ] Verificar que o calendário principal já filtra por unidade (deve funcionar)
- [ ] Testar modal de reposições filtrando por unidade
- [ ] Testar modal de aulas experimentais filtrando por unidade
- [ ] Testar modal de faltas futuras filtrando por unidade
- [ ] Testar troca de unidade e verificar atualização dos dados

---

### 7.7 Observações Importantes

1. **Calendário principal já funciona** - A tela principal já está preparada para multi-unidades.

2. **Apenas modais precisam de correção** - O trabalho é focado nos 3 modais auxiliares.

3. **Não há migração de dados** - Todas as tabelas já possuem `unit_id` preenchido.

4. **RPCs precisam de parâmetro opcional** - Para manter compatibilidade, usar `DEFAULT NULL`.

---

## Fase 8: Tela Abrindo Horizontes

### 8.1 Visão Geral da Arquitetura

A funcionalidade de Abrindo Horizontes (AH) gerencia o fluxo completo de correção de apostilas: recolhimento → correção → entrega. Possui múltiplas telas e abas para gerenciar este processo.

**Arquivos principais:**

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/pages/AbrindoHorizontesFila.tsx` | Página | Fila principal com 3 abas |
| `src/pages/AbrindoHorizontesSelecao.tsx` | Página | Seleção de método de lançamento |
| `src/pages/AbrindoHorizontesAlunos.tsx` | Página | Lançamento AH por aluno |
| `src/pages/CorrecoesAbrindoHorizontes.tsx` | Página | Estatísticas de correções por professor |
| `src/components/abrindo-horizontes/FilaApostilasTable.tsx` | Componente | Tabela de apostilas recolhidas |
| `src/components/abrindo-horizontes/EstatisticasAH.tsx` | Componente | Cards de estatísticas de tempo |
| `src/components/abrindo-horizontes/ProximasColetasAH.tsx` | Componente | Lista de próximas coletas |
| `src/components/abrindo-horizontes/RecolherApostilasModal.tsx` | Modal | Recolher apostilas de pessoas |
| `src/components/abrindo-horizontes/IgnorarColetaModal.tsx` | Modal | Ignorar coleta temporariamente |

---

### 8.2 Status Atual do Banco de Dados

#### Tabelas que PRECISAM de `unit_id`:

| Tabela | unit_id | Ação necessária |
|--------|---------|-----------------|
| `ah_recolhidas` | ❌ NÃO POSSUI | Adicionar coluna |
| `ah_ignorar_coleta` | ❌ NÃO POSSUI | Adicionar coluna |
| `produtividade_ah` | ❌ NÃO POSSUI | Adicionar coluna |

#### RPCs que PRECISAM de parâmetro `p_unit_id`:

| RPC | Status | Ação necessária |
|-----|--------|-----------------|
| `get_todas_pessoas` | ❌ Não filtra | Adicionar parâmetro |
| `get_correcoes_ah_stats` | ❌ Não filtra | Adicionar parâmetro |
| `get_ah_tempo_stats` | ❌ Não filtra | Adicionar parâmetro |

---

### 8.3 Migrações de Banco de Dados Necessárias

#### 8.3.1 Adicionar Colunas `unit_id`

```sql
-- 1. Adicionar unit_id às tabelas de AH (nullable primeiro)
ALTER TABLE ah_recolhidas 
ADD COLUMN unit_id uuid REFERENCES units(id);

ALTER TABLE ah_ignorar_coleta 
ADD COLUMN unit_id uuid REFERENCES units(id);

ALTER TABLE produtividade_ah 
ADD COLUMN unit_id uuid REFERENCES units(id);
```

#### 8.3.2 Migrar Dados Existentes

```sql
-- 2. Preencher unit_id com base na pessoa (aluno ou funcionário)
UPDATE ah_recolhidas ar
SET unit_id = COALESCE(
  (SELECT unit_id FROM alunos WHERE id = ar.pessoa_id),
  (SELECT unit_id FROM funcionarios WHERE id = ar.pessoa_id)
)
WHERE ar.unit_id IS NULL;

UPDATE ah_ignorar_coleta aic
SET unit_id = COALESCE(
  (SELECT unit_id FROM alunos WHERE id = aic.pessoa_id),
  (SELECT unit_id FROM funcionarios WHERE id = aic.pessoa_id)
)
WHERE aic.unit_id IS NULL;

UPDATE produtividade_ah pah
SET unit_id = COALESCE(
  (SELECT unit_id FROM alunos WHERE id = pah.pessoa_id),
  (SELECT unit_id FROM funcionarios WHERE id = pah.pessoa_id)
)
WHERE pah.unit_id IS NULL;

-- 3. Definir unidade de Maringá como padrão para registros órfãos
UPDATE ah_recolhidas 
SET unit_id = (SELECT id FROM units WHERE nome ILIKE '%maringá%' LIMIT 1) 
WHERE unit_id IS NULL;

UPDATE ah_ignorar_coleta 
SET unit_id = (SELECT id FROM units WHERE nome ILIKE '%maringá%' LIMIT 1) 
WHERE unit_id IS NULL;

UPDATE produtividade_ah 
SET unit_id = (SELECT id FROM units WHERE nome ILIKE '%maringá%' LIMIT 1) 
WHERE unit_id IS NULL;

-- 4. Tornar NOT NULL após preencher
ALTER TABLE ah_recolhidas ALTER COLUMN unit_id SET NOT NULL;
ALTER TABLE ah_ignorar_coleta ALTER COLUMN unit_id SET NOT NULL;
ALTER TABLE produtividade_ah ALTER COLUMN unit_id SET NOT NULL;
```

---

### 8.4 Atualização de RPCs

#### 8.4.1 RPC `get_todas_pessoas`

```sql
CREATE OR REPLACE FUNCTION get_todas_pessoas(p_unit_id uuid DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  nome text,
  tipo text,
  turma_nome text,
  turma_id uuid,
  ultima_correcao_ah timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.nome,
    'aluno'::text as tipo,
    t.nome as turma_nome,
    a.turma_id,
    a.ultima_correcao_ah
  FROM alunos a
  LEFT JOIN turmas t ON a.turma_id = t.id
  WHERE a.active = true
    AND (p_unit_id IS NULL OR a.unit_id = p_unit_id)
  UNION ALL
  SELECT 
    f.id,
    f.nome,
    'funcionario'::text as tipo,
    t.nome as turma_nome,
    f.turma_id,
    f.ultima_correcao_ah
  FROM funcionarios f
  LEFT JOIN turmas t ON f.turma_id = t.id
  WHERE f.active = true 
    AND f.turma_id IS NOT NULL
    AND (p_unit_id IS NULL OR f.unit_id = p_unit_id)
  ORDER BY nome;
END;
$$ LANGUAGE plpgsql;
```

#### 8.4.2 RPC `get_correcoes_ah_stats`

```sql
CREATE OR REPLACE FUNCTION get_correcoes_ah_stats(p_unit_id uuid DEFAULT NULL)
RETURNS TABLE(
  professor_correcao text,
  mes_atual bigint,
  mes_anterior bigint,
  ultimos_3_meses bigint,
  ultimos_6_meses bigint,
  ultimos_12_meses bigint
) AS $$
DECLARE
  data_atual date := CURRENT_DATE;
  inicio_mes_atual date := date_trunc('month', data_atual)::date;
  inicio_mes_anterior date := (date_trunc('month', data_atual) - interval '1 month')::date;
  fim_mes_anterior date := (date_trunc('month', data_atual) - interval '1 day')::date;
BEGIN
  RETURN QUERY
  SELECT 
    f.nome as professor_correcao,
    COUNT(*) FILTER (WHERE pah.created_at >= inicio_mes_atual) as mes_atual,
    COUNT(*) FILTER (WHERE pah.created_at >= inicio_mes_anterior AND pah.created_at < inicio_mes_atual) as mes_anterior,
    COUNT(*) FILTER (WHERE pah.created_at >= (data_atual - interval '3 months')) as ultimos_3_meses,
    COUNT(*) FILTER (WHERE pah.created_at >= (data_atual - interval '6 months')) as ultimos_6_meses,
    COUNT(*) FILTER (WHERE pah.created_at >= (data_atual - interval '12 months')) as ultimos_12_meses
  FROM produtividade_ah pah
  JOIN funcionarios f ON pah.professor_correcao = f.id::text OR pah.funcionario_registro_id = f.id
  WHERE pah.created_at >= (data_atual - interval '12 months')
    AND (p_unit_id IS NULL OR pah.unit_id = p_unit_id)
  GROUP BY f.nome
  ORDER BY ultimos_12_meses DESC;
END;
$$ LANGUAGE plpgsql;
```

#### 8.4.3 RPC `get_ah_tempo_stats`

```sql
CREATE OR REPLACE FUNCTION get_ah_tempo_stats(p_unit_id uuid DEFAULT NULL)
RETURNS TABLE(
  tempo_medio_coleta_correcao numeric,
  tempo_medio_coleta_entrega numeric,
  tempo_medio_correcao_entrega numeric,
  tempo_medio_inicio_fim_correcao numeric,
  total_apostilas_corrigidas bigint,
  total_apostilas_entregues bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(AVG(EXTRACT(EPOCH FROM (ar.data_inicio_correcao - ar.data_recolhida::timestamp)) / 86400)::numeric, 1) as tempo_medio_coleta_correcao,
    ROUND(AVG(EXTRACT(EPOCH FROM (ar.data_entrega_real::timestamp - ar.data_recolhida::timestamp)) / 86400)::numeric, 1) as tempo_medio_coleta_entrega,
    ROUND(AVG(EXTRACT(EPOCH FROM (ar.data_entrega_real::timestamp - ar.data_inicio_correcao)) / 86400)::numeric, 1) as tempo_medio_correcao_entrega,
    NULL::numeric as tempo_medio_inicio_fim_correcao,
    COUNT(*) FILTER (WHERE ar.data_inicio_correcao IS NOT NULL) as total_apostilas_corrigidas,
    COUNT(*) FILTER (WHERE ar.data_entrega_real IS NOT NULL) as total_apostilas_entregues
  FROM ah_recolhidas ar
  WHERE (p_unit_id IS NULL OR ar.unit_id = p_unit_id);
END;
$$ LANGUAGE plpgsql;
```

---

### 8.5 Atualização da Edge Function

#### 8.5.1 `register-ah/index.ts`

**Alterações necessárias:**

1. Receber `unit_id` no body da requisição
2. Incluir `unit_id` ao inserir em `produtividade_ah`

```typescript
// Extrair unit_id do body
const data = requestData.data || requestData;
const unitId = data.unit_id;

if (!unitId) {
  console.error('unit_id não fornecido');
  return new Response(
    JSON.stringify({ error: 'unit_id é obrigatório.' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
  );
}

// Incluir na inserção
const insertData = {
  pessoa_id: data.aluno_id,
  tipo_pessoa: tipoPessoa,
  apostila: data.apostila,
  exercicios: data.exercicios,
  erros: data.erros,
  professor_correcao: data.funcionario_registro_id || data.professor_correcao,
  funcionario_registro_id: data.funcionario_registro_id || null,
  comentario: data.comentario,
  data_fim_correcao: data.data_fim_correcao,
  aluno_nome: pessoaData?.nome,
  ah_recolhida_id: data.ah_recolhida_id || null,
  unit_id: unitId  // Novo campo
};
```

---

### 8.6 Alterações no Frontend (Hooks)

#### 8.6.1 `use-apostilas-recolhidas.ts`

```typescript
export const useApostilasRecolhidas = (unitId?: string) => {
  return useQuery({
    queryKey: ["apostilas-recolhidas", unitId],
    queryFn: async () => {
      let query = supabase
        .from("ah_recolhidas")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (unitId) {
        query = query.eq('unit_id', unitId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};
```

#### 8.6.2 `use-proximas-coletas-ah.ts`

```typescript
export const useProximasColetasAH = (unitId?: string) => {
  return useQuery({
    queryKey: ["proximas-coletas-ah", unitId],
    queryFn: async () => {
      // Filtrar alunos por unidade
      let alunosQuery = supabase.from("alunos").select("*").eq("active", true);
      if (unitId) {
        alunosQuery = alunosQuery.eq('unit_id', unitId);
      }
      // ... resto da lógica
    },
  });
};
```

#### 8.6.3 `use-alunos-ignorados-ah.ts`

```typescript
export const useAlunosIgnoradosAH = (unitId?: string) => {
  return useQuery({
    queryKey: ['alunos-ignorados-ah', unitId],
    queryFn: async () => {
      let query = supabase
        .from('ah_ignorar_coleta')
        .select('*')
        .eq('active', true)
        .gte('data_fim', new Date().toISOString())
        .order('data_fim', { ascending: true });

      if (unitId) {
        query = query.eq('unit_id', unitId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      // ... resto da lógica
    },
  });
};
```

#### 8.6.4 `use-todos-alunos.ts`

```typescript
export const useTodosAlunos = (unitId?: string) => {
  return useQuery({
    queryKey: ["todos-alunos", unitId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_todas_pessoas', {
        p_unit_id: unitId || null
      });
      if (error) throw error;
      return data;
    },
  });
};
```

#### 8.6.5 `use-ah-tempo-stats.ts`

```typescript
export const useAHTempoStats = (unitId?: string) => {
  return useQuery({
    queryKey: ['ah-tempo-stats', unitId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_ah_tempo_stats', {
        p_unit_id: unitId || null
      });
      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    },
  });
};
```

#### 8.6.6 `use-correcoes-ah-stats.ts`

```typescript
export const useCorrecoesAHStats = (unitId?: string) => {
  return useQuery({
    queryKey: ['correcoes-ah-stats', unitId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_correcoes_ah_stats', {
        p_unit_id: unitId || null
      });
      if (error) throw error;
      return data;
    },
  });
};
```

#### 8.6.7 `use-pessoas-com-recolhimento-aberto.ts`

```typescript
export const usePessoasComRecolhimentoAberto = (unitId?: string) => {
  return useQuery({
    queryKey: ["pessoas-com-recolhimento-aberto", unitId],
    queryFn: async () => {
      let query = supabase
        .from("ah_recolhidas")
        .select("*")
        .is("data_entrega_real", null);

      if (unitId) {
        query = query.eq('unit_id', unitId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};
```

#### 8.6.8 `use-ah-correcao.ts`

```typescript
interface CorrecaoAHData {
  apostilaRecolhidaId: string;
  pessoaId: string;
  apostilaNome: string;
  exercicios: number;
  erros: number;
  funcionarioRegistroId: string;
  dataFimCorrecao: string;
  comentario?: string;
  unitId: string;  // Novo campo
}

export const useAhCorrecao = () => {
  const registrarCorrecaoAH = useMutation({
    mutationFn: async (data: CorrecaoAHData) => {
      const { data: result, error } = await supabase.functions.invoke("register-ah", {
        body: {
          aluno_id: data.pessoaId,
          apostila: data.apostilaNome,
          exercicios: data.exercicios,
          erros: data.erros,
          funcionario_registro_id: data.funcionarioRegistroId,
          data_fim_correcao: data.dataFimCorrecao,
          comentario: data.comentario || null,
          ah_recolhida_id: data.apostilaRecolhidaId,
          unit_id: data.unitId,  // Novo campo
        },
      });
      if (error) throw error;
      return result;
    },
  });
  // ...
};
```

---

### 8.7 Alterações no Frontend (Páginas e Componentes)

#### 8.7.1 Páginas

**`AbrindoHorizontesFila.tsx`:**
```typescript
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

const AbrindoHorizontesFila = () => {
  const { activeUnit } = useActiveUnit();
  
  return (
    <div>
      <FilaApostilasTable unitId={activeUnit?.id} />
      <EstatisticasAH unitId={activeUnit?.id} />
      <ProximasColetasAH unitId={activeUnit?.id} />
    </div>
  );
};
```

**`AbrindoHorizontesAlunos.tsx`:**
```typescript
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

const AbrindoHorizontesAlunos = () => {
  const { activeUnit } = useActiveUnit();
  const { data: pessoas } = useTodosAlunos(activeUnit?.id);
  // ... usar activeUnit?.id nas chamadas de correção
};
```

**`CorrecoesAbrindoHorizontes.tsx`:**
```typescript
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

const CorrecoesAbrindoHorizontes = () => {
  const { activeUnit } = useActiveUnit();
  const { data: stats } = useCorrecoesAHStats(activeUnit?.id);
  // ...
};
```

#### 8.7.2 Componentes

**`FilaApostilasTable.tsx`:**
```typescript
interface FilaApostilasTableProps {
  unitId?: string;
}

const FilaApostilasTable = ({ unitId }: FilaApostilasTableProps) => {
  const { data: apostilas } = useApostilasRecolhidas(unitId);
  const { data: pessoasAbertas } = usePessoasComRecolhimentoAberto(unitId);
  // ...
};
```

**`EstatisticasAH.tsx`:**
```typescript
interface EstatisticasAHProps {
  unitId?: string;
}

const EstatisticasAH = ({ unitId }: EstatisticasAHProps) => {
  const { data: stats } = useAHTempoStats(unitId);
  // ...
};
```

**`ProximasColetasAH.tsx`:**
```typescript
interface ProximasColetasAHProps {
  unitId?: string;
}

const ProximasColetasAH = ({ unitId }: ProximasColetasAHProps) => {
  const { data: proximasColetas } = useProximasColetasAH(unitId);
  const { data: ignorados } = useAlunosIgnoradosAH(unitId);
  // ...
};
```

**`RecolherApostilasModal.tsx`:**
```typescript
interface RecolherApostilasModalProps {
  unitId?: string;
  // ... outras props
}

const RecolherApostilasModal = ({ unitId, ...props }: RecolherApostilasModalProps) => {
  const handleRecolher = async () => {
    await supabase.from('ah_recolhidas').insert({
      pessoa_id: pessoaSelecionada.id,
      apostila: apostilaSelecionada,
      data_recolhida: new Date().toISOString(),
      unit_id: unitId,  // Incluir unit_id
      // ... outros campos
    });
  };
  // ...
};
```

**`IgnorarColetaModal.tsx`:**
```typescript
interface IgnorarColetaModalProps {
  unitId?: string;
  // ... outras props
}

const IgnorarColetaModal = ({ unitId, ...props }: IgnorarColetaModalProps) => {
  const handleIgnorar = async () => {
    await supabase.from('ah_ignorar_coleta').insert({
      pessoa_id: pessoaSelecionada.id,
      dias: diasIgnorar,
      motivo: motivo,
      unit_id: unitId,  // Incluir unit_id
      // ... outros campos
    });
  };
  // ...
};
```

---

### 8.8 Checklist de Tarefas

#### Banco de Dados (Migrações)
- [ ] Adicionar `unit_id` à tabela `ah_recolhidas`
- [ ] Adicionar `unit_id` à tabela `ah_ignorar_coleta`
- [ ] Adicionar `unit_id` à tabela `produtividade_ah`
- [ ] Migrar dados existentes (preencher unit_id baseado na pessoa)
- [ ] Definir colunas como NOT NULL após migração

#### Banco de Dados (RPCs)
- [ ] Atualizar RPC `get_todas_pessoas`:
  - [ ] Adicionar parâmetro `p_unit_id uuid DEFAULT NULL`
  - [ ] Adicionar filtro por unidade nas queries

- [ ] Atualizar RPC `get_correcoes_ah_stats`:
  - [ ] Adicionar parâmetro `p_unit_id uuid DEFAULT NULL`
  - [ ] Adicionar filtro por unidade

- [ ] Atualizar RPC `get_ah_tempo_stats`:
  - [ ] Adicionar parâmetro `p_unit_id uuid DEFAULT NULL`
  - [ ] Adicionar filtro por unidade

#### Edge Function
- [ ] Atualizar `register-ah/index.ts`:
  - [ ] Receber `unit_id` no body
  - [ ] Incluir `unit_id` ao inserir em `produtividade_ah`

#### Frontend (Hooks)
- [ ] Atualizar `use-apostilas-recolhidas.ts`:
  - [ ] Adicionar parâmetro `unitId?: string`
  - [ ] Filtrar por `unit_id`
  - [ ] Incluir `unitId` na queryKey

- [ ] Atualizar `use-proximas-coletas-ah.ts`:
  - [ ] Adicionar parâmetro `unitId?: string`
  - [ ] Filtrar alunos e funcionários por `unit_id`
  - [ ] Incluir `unitId` na queryKey

- [ ] Atualizar `use-alunos-ignorados-ah.ts`:
  - [ ] Adicionar parâmetro `unitId?: string`
  - [ ] Filtrar por `unit_id`
  - [ ] Incluir `unitId` na queryKey

- [ ] Atualizar `use-todos-alunos.ts`:
  - [ ] Adicionar parâmetro `unitId?: string`
  - [ ] Passar `p_unit_id` para RPC
  - [ ] Incluir `unitId` na queryKey

- [ ] Atualizar `use-ah-tempo-stats.ts`:
  - [ ] Adicionar parâmetro `unitId?: string`
  - [ ] Passar `p_unit_id` para RPC
  - [ ] Incluir `unitId` na queryKey

- [ ] Atualizar `use-correcoes-ah-stats.ts`:
  - [ ] Adicionar parâmetro `unitId?: string`
  - [ ] Passar `p_unit_id` para RPC
  - [ ] Incluir `unitId` na queryKey

- [ ] Atualizar `use-pessoas-com-recolhimento-aberto.ts`:
  - [ ] Adicionar parâmetro `unitId?: string`
  - [ ] Filtrar por `unit_id`
  - [ ] Incluir `unitId` na queryKey

- [ ] Atualizar `use-ah-correcao.ts`:
  - [ ] Receber `unitId` como parâmetro na interface
  - [ ] Passar `unit_id` para edge function

#### Frontend (Páginas)
- [ ] Atualizar `AbrindoHorizontesFila.tsx`:
  - [ ] Importar e usar `useActiveUnit()`
  - [ ] Passar `activeUnit?.id` para componentes filhos

- [ ] Atualizar `AbrindoHorizontesAlunos.tsx`:
  - [ ] Importar e usar `useActiveUnit()`
  - [ ] Passar `activeUnit?.id` para hooks

- [ ] Atualizar `CorrecoesAbrindoHorizontes.tsx`:
  - [ ] Importar e usar `useActiveUnit()`
  - [ ] Passar `activeUnit?.id` para hook

#### Frontend (Componentes)
- [ ] Atualizar `FilaApostilasTable.tsx`:
  - [ ] Adicionar prop `unitId?: string`
  - [ ] Passar para useApostilasRecolhidas
  - [ ] Passar para usePessoasComRecolhimentoAberto

- [ ] Atualizar `EstatisticasAH.tsx`:
  - [ ] Adicionar prop `unitId?: string`
  - [ ] Passar para useAHTempoStats

- [ ] Atualizar `ProximasColetasAH.tsx`:
  - [ ] Adicionar prop `unitId?: string`
  - [ ] Passar para useProximasColetasAH
  - [ ] Passar para useAlunosIgnoradosAH

- [ ] Atualizar `RecolherApostilasModal.tsx`:
  - [ ] Adicionar prop `unitId?: string`
  - [ ] Incluir `unit_id` ao inserir em ah_recolhidas

- [ ] Atualizar `IgnorarColetaModal.tsx`:
  - [ ] Adicionar prop `unitId?: string`
  - [ ] Incluir `unit_id` ao inserir em ah_ignorar_coleta

#### Testes
- [ ] Verificar que fila de apostilas filtra por unidade
- [ ] Verificar que próximas coletas filtra por unidade
- [ ] Verificar que estatísticas de tempo filtra por unidade
- [ ] Verificar que estatísticas de correções filtra por unidade
- [ ] Verificar que recolher apostilas salva com unit_id correto
- [ ] Verificar que ignorar coleta salva com unit_id correto
- [ ] Verificar que lançar AH (register-ah) salva com unit_id correto
- [ ] Testar troca de unidade e verificar atualização dos dados

---

### 8.9 Observações Importantes

1. **Migração de dados é crítica** - Todas as 3 tabelas precisam de `unit_id` preenchido antes de implementar os filtros no frontend.

2. **Edge function precisa de atualização** - A função `register-ah` precisa receber e salvar o `unit_id` para novos registros.

3. **RPCs são centrais** - Três RPCs (`get_todas_pessoas`, `get_correcoes_ah_stats`, `get_ah_tempo_stats`) precisam de atualização para suportar filtro por unidade.

4. **Muitos hooks afetados** - São 8 hooks que precisam de atualização para receber e usar `unitId`.

5. **Ordem de implementação sugerida**:
   - 1º: Migração do banco (adicionar colunas, preencher dados, definir NOT NULL)
   - 2º: Atualizar RPCs
   - 3º: Atualizar edge function
   - 4º: Atualizar hooks
   - 5º: Atualizar páginas e componentes

---

## Fase 9: Tela Alertas de Evasão - Análise para Migração Multi-Unidades

### 9.1 Visão Geral da Arquitetura

A funcionalidade de Alertas de Evasão é um sistema complexo que gerencia o fluxo completo de retenção e evasão de alunos. Possui múltiplas telas, componentes e hooks interconectados.

**Arquivos principais:**

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/pages/AlertasEvasao.tsx` | Página | Painel principal de evasões com tabela e filtros |
| `src/pages/PainelPedagogico.tsx` | Página | Painel Kanban pedagógico |
| `src/pages/Retencoes.tsx` | Página | Gestão de retenções com histórico |
| `src/hooks/use-alertas-evasao.ts` | Hook | Criação de novos alertas |
| `src/hooks/use-alertas-evasao-lista.ts` | Hook | Listagem de alertas com filtros |
| `src/hooks/use-atividades-alerta-evasao.ts` | Hook | Gerenciamento de atividades do fluxo |
| `src/hooks/use-atividades-evasao-home.ts` | Hook | Atividades de evasão na Home |
| `src/hooks/use-retencoes-historico.ts` | Hook | Histórico de retenções |
| `src/hooks/use-kanban-cards.ts` | Hook | Cards do Kanban pedagógico |
| `src/components/alerta-evasao/AtividadesDrawer.tsx` | Componente | Drawer de atividades de evasão |
| `src/components/alerta-evasao/AlertaEvasaoModal.tsx` | Componente | Modal para criar alerta |
| `src/components/pedagogical/PedagogicalKanban.tsx` | Componente | Kanban de alertas pedagógicos |

---

### 9.2 Status Atual - Análise do Banco de Dados

#### Tabelas relacionadas a Alertas de Evasão:

| Tabela | unit_id | Descrição |
|--------|---------|-----------|
| `alerta_evasao` | ❌ NÃO POSSUI | Tabela principal de alertas |
| `atividades_alerta_evasao` | ❌ NÃO POSSUI | Atividades do fluxo de retenção |
| `kanban_cards` | ❌ NÃO POSSUI | Cards do Kanban pedagógico |

#### RPCs que PRECISAM de parâmetro `p_unit_id`:

| RPC | Status | Ação necessária |
|-----|--------|-----------------|
| `get_alunos_retencoes_historico` | ❌ Não filtra | Adicionar parâmetro |
| `get_aluno_detalhes` | ❌ Não filtra | Adicionar parâmetro |

---

### 9.3 Migrações de Banco de Dados Necessárias

#### 9.3.1 Adicionar `unit_id` às Tabelas

```sql
-- 1. Adicionar unit_id à tabela alerta_evasao
ALTER TABLE alerta_evasao 
ADD COLUMN unit_id uuid REFERENCES units(id);

-- 2. Adicionar unit_id à tabela atividades_alerta_evasao
ALTER TABLE atividades_alerta_evasao 
ADD COLUMN unit_id uuid REFERENCES units(id);

-- 3. Adicionar unit_id à tabela kanban_cards
ALTER TABLE kanban_cards 
ADD COLUMN unit_id uuid REFERENCES units(id);
```

#### 9.3.2 Preencher `unit_id` com Base no Aluno

```sql
-- Preencher unit_id em alerta_evasao baseado no aluno
UPDATE alerta_evasao ae
SET unit_id = (
  SELECT a.unit_id 
  FROM alunos a 
  WHERE a.id = ae.aluno_id
)
WHERE ae.unit_id IS NULL;

-- Preencher unit_id em atividades_alerta_evasao baseado no alerta
UPDATE atividades_alerta_evasao aae
SET unit_id = (
  SELECT ae.unit_id 
  FROM alerta_evasao ae 
  WHERE ae.id = aae.alerta_evasao_id
)
WHERE aae.unit_id IS NULL;

-- Preencher unit_id em kanban_cards baseado no alerta
UPDATE kanban_cards kc
SET unit_id = (
  SELECT ae.unit_id 
  FROM alerta_evasao ae 
  WHERE ae.id = kc.alerta_evasao_id
)
WHERE kc.unit_id IS NULL;

-- Definir unidade de Maringá como padrão para registros órfãos
UPDATE alerta_evasao 
SET unit_id = (SELECT id FROM units WHERE nome ILIKE '%maringá%' LIMIT 1) 
WHERE unit_id IS NULL;

UPDATE atividades_alerta_evasao 
SET unit_id = (SELECT id FROM units WHERE nome ILIKE '%maringá%' LIMIT 1) 
WHERE unit_id IS NULL;

UPDATE kanban_cards 
SET unit_id = (SELECT id FROM units WHERE nome ILIKE '%maringá%' LIMIT 1) 
WHERE unit_id IS NULL;

-- Tornar NOT NULL após preencher
ALTER TABLE alerta_evasao ALTER COLUMN unit_id SET NOT NULL;
ALTER TABLE atividades_alerta_evasao ALTER COLUMN unit_id SET NOT NULL;
ALTER TABLE kanban_cards ALTER COLUMN unit_id SET NOT NULL;
```

---

### 9.4 Atualização de RPCs

#### 9.4.1 `get_alunos_retencoes_historico`

```sql
CREATE OR REPLACE FUNCTION get_alunos_retencoes_historico(
  p_search_term text DEFAULT '',
  p_status_filter text DEFAULT 'todos',
  p_incluir_ocultos boolean DEFAULT false,
  p_unit_id uuid DEFAULT NULL  -- NOVO PARÂMETRO
)
RETURNS TABLE(...)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT ...
  FROM alunos a
  LEFT JOIN alerta_evasao ae ON ...
  WHERE a.active = true
    AND (p_unit_id IS NULL OR a.unit_id = p_unit_id)  -- NOVO FILTRO
    -- ... resto da lógica
  ;
END;
$function$;
```

#### 9.4.2 `get_aluno_detalhes`

```sql
CREATE OR REPLACE FUNCTION get_aluno_detalhes(
  p_aluno_nome text,
  p_unit_id uuid DEFAULT NULL  -- NOVO PARÂMETRO
)
RETURNS TABLE(...)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT ...
  FROM alunos a
  WHERE a.nome ILIKE '%' || p_aluno_nome || '%'
    AND (p_unit_id IS NULL OR a.unit_id = p_unit_id)  -- NOVO FILTRO
  ;
END;
$function$;
```

---

### 9.5 Alterações no Frontend (Hooks)

#### Hooks que precisam de `unitId`:

| Hook | Arquivo | Ação |
|------|---------|------|
| `useAlertasEvasao` | `use-alertas-evasao.ts` | Receber `unitId`, salvar em alerta_evasao |
| `useAlertasEvasaoLista` | `use-alertas-evasao-lista.ts` | Receber `unitId`, filtrar alertas por unidade |
| `useAtividadesAlertaEvasao` | `use-atividades-alerta-evasao.ts` | Receber `unitId`, salvar em atividades |
| `useAtividadesEvasaoHome` | `use-atividades-evasao-home.ts` | Receber `unitId`, filtrar atividades |
| `useRetencoesHistorico` | `use-retencoes-historico.ts` | Receber `unitId`, passar para RPC |
| `useKanbanCards` | `use-kanban-cards.ts` | Receber `unitId`, filtrar cards |

#### Exemplo de atualização - `use-alertas-evasao-lista.ts`:

```typescript
interface FiltrosAlertasEvasao {
  // ... filtros existentes
  unitId?: string;  // NOVO
}

export const useAlertasEvasaoLista = (filtros?: FiltrosAlertasEvasao) => {
  return useQuery({
    queryKey: ['alertas-evasao-lista', filtros],
    queryFn: async () => {
      let query = supabase
        .from('alerta_evasao')
        .select(`...`)
        .eq('aluno.active', true);
      
      // NOVO: Filtrar por unidade
      if (filtros?.unitId) {
        query = query.eq('unit_id', filtros.unitId);
      }
      
      // ... resto da query
    }
  });
};
```

#### Exemplo de atualização - `use-alertas-evasao.ts` (criação):

```typescript
export function useAlertasEvasao(unitId?: string) {
  // ... código existente
  
  const handleSubmit = async (onClose: () => void) => {
    // ...
    
    const dadosAlerta = {
      aluno_id: alunoSelecionado,
      data_alerta: dataAlertaFormatada,
      origem_alerta: origemAlerta!,
      descritivo: descritivo,
      responsavel: profileId,
      status: 'pendente' as const,
      kanban_status: 'todo',
      funcionario_registro_id: funcionarioId || null,
      unit_id: unitId  // NOVO
    };
    
    // ... inserir alerta
  };
}
```

---

### 9.6 Alterações no Frontend (Páginas e Componentes)

#### Páginas que precisam usar `useActiveUnit()`:

| Página | Ação |
|--------|------|
| `AlertasEvasao.tsx` | Importar `useActiveUnit()`, passar para hooks e componentes |
| `PainelPedagogico.tsx` | Importar `useActiveUnit()`, passar para `PedagogicalKanban` |
| `Retencoes.tsx` | Importar `useActiveUnit()`, passar para `useRetencoesHistorico` |

#### Componentes que precisam receber `unitId` via props:

| Componente | Ação |
|------------|------|
| `AlertaEvasaoModal.tsx` | Receber `unitId`, passar para `useAlertasEvasao` |
| `AtividadesDrawer.tsx` | Receber `unitId`, passar para hooks de atividades |
| `PedagogicalKanban.tsx` | Receber `unitId`, passar para `useKanbanCards` |

---

### 9.7 Checklist de Tarefas

#### Banco de Dados (Migrações)
- [ ] Adicionar `unit_id` à tabela `alerta_evasao`
- [ ] Adicionar `unit_id` à tabela `atividades_alerta_evasao`
- [ ] Adicionar `unit_id` à tabela `kanban_cards`
- [ ] Migrar dados existentes (preencher unit_id baseado no aluno)
- [ ] Definir colunas como NOT NULL após migração

#### Banco de Dados (RPCs)
- [ ] Atualizar RPC `get_alunos_retencoes_historico`:
  - [ ] Adicionar parâmetro `p_unit_id uuid DEFAULT NULL`
  - [ ] Adicionar filtro por unidade na query

- [ ] Atualizar RPC `get_aluno_detalhes`:
  - [ ] Adicionar parâmetro `p_unit_id uuid DEFAULT NULL`
  - [ ] Adicionar filtro por unidade na query

#### Frontend (Hooks)
- [ ] Atualizar `use-alertas-evasao.ts`:
  - [ ] Receber `unitId` como parâmetro
  - [ ] Incluir `unit_id` ao inserir novo alerta

- [ ] Atualizar `use-alertas-evasao-lista.ts`:
  - [ ] Adicionar `unitId` aos filtros
  - [ ] Filtrar por `unit_id`
  - [ ] Incluir `unitId` na queryKey

- [ ] Atualizar `use-atividades-alerta-evasao.ts`:
  - [ ] Receber `unitId` como parâmetro
  - [ ] Incluir `unit_id` ao criar atividades

- [ ] Atualizar `use-atividades-evasao-home.ts`:
  - [ ] Receber `unitId` como parâmetro
  - [ ] Filtrar atividades por unidade
  - [ ] Incluir `unitId` na queryKey

- [ ] Atualizar `use-retencoes-historico.ts`:
  - [ ] Receber `unitId` como parâmetro
  - [ ] Passar `p_unit_id` para RPC
  - [ ] Incluir `unitId` nas dependências

- [ ] Atualizar `use-kanban-cards.ts`:
  - [ ] Receber `unitId` como parâmetro
  - [ ] Filtrar cards por `unit_id`
  - [ ] Incluir `unitId` na queryKey

#### Frontend (Páginas)
- [ ] Atualizar `AlertasEvasao.tsx`:
  - [ ] Importar e usar `useActiveUnit()`
  - [ ] Passar `activeUnit?.id` para `useAlertasEvasaoLista`
  - [ ] Passar `activeUnit?.id` para `AtividadesDrawer`

- [ ] Atualizar `PainelPedagogico.tsx`:
  - [ ] Importar e usar `useActiveUnit()`
  - [ ] Passar `activeUnit?.id` para `PedagogicalKanban`

- [ ] Atualizar `Retencoes.tsx`:
  - [ ] Importar e usar `useActiveUnit()`
  - [ ] Passar `activeUnit?.id` para `useRetencoesHistorico`

#### Frontend (Componentes)
- [ ] Atualizar `AlertaEvasaoModal.tsx`:
  - [ ] Adicionar prop `unitId?: string`
  - [ ] Passar para `useAlertasEvasao`

- [ ] Atualizar `AtividadesDrawer.tsx`:
  - [ ] Adicionar prop `unitId?: string`
  - [ ] Passar para `useAtividadesAlertaEvasao`

- [ ] Atualizar `PedagogicalKanban.tsx`:
  - [ ] Adicionar prop `unitId?: string`
  - [ ] Passar para hooks

#### Considerações Especiais
- [ ] Verificar trigger `trigger_criar_atividade_acolhimento`:
  - [ ] Garantir que atividades automáticas recebam `unit_id` do alerta pai

- [ ] Webhooks externos (n8n, Make):
  - [ ] Considerar incluir `unit_id` nos payloads se necessário

#### Testes
- [ ] Verificar que alertas são filtrados por unidade na listagem
- [ ] Verificar que novos alertas salvam com unit_id correto
- [ ] Verificar que atividades são filtradas por unidade
- [ ] Verificar que cards do Kanban são filtrados por unidade
- [ ] Verificar que histórico de retenções filtra por unidade
- [ ] Verificar que atividades na Home filtram por unidade
- [ ] Testar troca de unidade e verificar atualização dos dados

---

### 9.8 Observações Importantes

1. **Complexidade alta** - Esta é uma das funcionalidades mais complexas do sistema, com muitos hooks e componentes interconectados.

2. **Migração de dados é crítica** - As 3 tabelas principais (`alerta_evasao`, `atividades_alerta_evasao`, `kanban_cards`) precisam de `unit_id` preenchido via relacionamento com aluno.

3. **Webhooks externos** - Os alertas enviam dados para webhooks n8n e Make. Considerar incluir `unit_id` nos payloads se necessário.

4. **Trigger de banco** - Existe uma trigger `trigger_criar_atividade_acolhimento` que cria atividades automaticamente. Verificar se precisa de ajuste para incluir `unit_id`.

5. **Integração com Home** - O hook `use-atividades-evasao-home.ts` já está documentado na Fase 5 (Home) como precisando de atualização.

6. **Ordem de implementação sugerida**:
   - 1º: Migração do banco (adicionar colunas, preencher dados, definir NOT NULL)
   - 2º: Atualizar RPCs
   - 3º: Atualizar trigger de criação de atividade (se necessário)
   - 4º: Atualizar hooks
   - 5º: Atualizar páginas e componentes

---

## Fase 10: Página Configurações (Vínculos Professor) - Análise para Migração Multi-Unidades

### 10.1 Visão Geral da Arquitetura

A página de Configurações do Sistema (`AdminConfiguracao.tsx`) possui atualmente 4 abas:
- **Dados Importantes** - Será removida
- **Vínculos Professor** - Será migrada para multi-unidades
- **Sincronização XLS** - Será removida (já documentada na Fase 6)
- **Configurações Gerais** - Será removida (placeholder sem funcionalidade)

**Arquivos principais:**

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/pages/AdminConfiguracao.tsx` | Página | Página de configurações com abas |
| `src/components/admin/VincularProfessorModal.tsx` | Componente | Modal para vincular professor a usuário |

---

### 10.2 Status Atual - Análise do Código

#### Problemas identificados:

| Item | Status Atual | Problema |
|------|--------------|----------|
| `MARINGA_UNIT_ID` | Hardcoded na página | ID fixo de Maringá |
| Query de usuários | Filtra por Maringá | Não usa `useActiveUnit()` |
| Query de professores (modal) | Busca todos ativos | Não filtra por unidade |

#### Código problemático em `AdminConfiguracao.tsx`:

```typescript
// HARDCODED - Deve ser removido
const MARINGA_UNIT_ID = '0df79a04-444e-46ee-b218-59e4b1835f4a';
```

---

### 10.3 Alterações Necessárias

#### 10.3.1 Simplificação da Página

**Remover:**
- Estrutura de `Tabs` (ficará apenas conteúdo de vínculos)
- Imports não utilizados: `AdminDadosImportantesForm`, `XlsUploadComponent`, `XlsSyncStatus`
- Ícones não utilizados: `Database`, `FileSpreadsheet`, `Settings`

**Alterar:**
- Título da página: "Configurações do Sistema" → "Vínculos Professor"

#### 10.3.2 Migração Multi-Unidades

##### `AdminConfiguracao.tsx`:

```typescript
// ANTES
const MARINGA_UNIT_ID = '0df79a04-444e-46ee-b218-59e4b1835f4a';
// ... query usando MARINGA_UNIT_ID

// DEPOIS
import { useActiveUnit } from '@/contexts/ActiveUnitContext';

const { activeUnit } = useActiveUnit();

// Na query: trocar MARINGA_UNIT_ID por activeUnit?.id
const { data: unitUsersMaringa, error: unitUsersError } = await supabase
  .from('unit_users')
  .select('user_id')
  .eq('unit_id', activeUnit?.id)  // ALTERADO
  .eq('active', true);
```

##### `VincularProfessorModal.tsx`:

```typescript
// Adicionar prop unitId
interface VincularProfessorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  unitId?: string;  // NOVO
}

// Na query de professores, filtrar por unidade
const { data: professores, isLoading } = useQuery({
  queryKey: ['professores-disponiveis', unitId],  // ALTERADO
  queryFn: async () => {
    let query = supabase
      .from('professores')
      .select('id, nome, email')
      .eq('status', true)
      .order('nome');
    
    // NOVO: Filtrar por unidade
    if (unitId) {
      query = query.eq('unit_id', unitId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
  enabled: open,
});
```

---

### 10.4 Checklist de Tarefas

#### Simplificação da Página
- [ ] Remover estrutura de Tabs
- [ ] Remover imports: `AdminDadosImportantesForm`, `XlsUploadComponent`, `XlsSyncStatus`
- [ ] Remover ícones não utilizados: `Database`, `FileSpreadsheet`, `Settings`
- [ ] Alterar título para "Vínculos Professor"

#### Frontend (Página)
- [ ] Atualizar `AdminConfiguracao.tsx`:
  - [ ] Importar `useActiveUnit()`
  - [ ] Remover constante `MARINGA_UNIT_ID` hardcoded
  - [ ] Usar `activeUnit?.id` na query de usuários
  - [ ] Passar `activeUnit?.id` para `VincularProfessorModal`
  - [ ] Atualizar `queryKey` para incluir `activeUnit?.id`

#### Frontend (Componente)
- [ ] Atualizar `VincularProfessorModal.tsx`:
  - [ ] Adicionar prop `unitId?: string`
  - [ ] Filtrar professores por `unit_id` se fornecido
  - [ ] Atualizar `queryKey` para incluir `unitId`

#### Testes
- [ ] Verificar que usuários são filtrados pela unidade ativa
- [ ] Verificar que professores disponíveis são filtrados pela unidade ativa
- [ ] Verificar que vínculo funciona corretamente
- [ ] Testar troca de unidade e verificar atualização dos dados

---

### 10.5 Observações Importantes

1. **Fase simples** - Esta é uma migração simples, apenas frontend, sem alterações de banco de dados.

2. **Não há tabelas para migrar** - Os dados já estão vinculados via `unit_users` e `professores.unit_id`.

3. **Remoção de código legado** - As abas removidas são funcionalidades já migradas (XLS na Fase 6) ou não implementadas.

4. **Ordem de implementação sugerida**:
   - 1º: Remover abas e simplificar página
   - 2º: Adicionar `useActiveUnit()` 
   - 3º: Atualizar `VincularProfessorModal` para receber `unitId`
   - 4º: Testar funcionalidade

---

## Próximos Passos

1. ✅ **Criar este documento de plano**
2. ✅ **Documentar análise da tela Home (Fase 5)**
3. ✅ **Documentar análise da tela Sincronizar Turmas (Fase 6)**
4. ✅ **Documentar análise da tela Calendário de Aulas (Fase 7)**
5. ✅ **Documentar análise da tela Abrindo Horizontes (Fase 8)**
6. ✅ **Documentar análise da tela Alertas de Evasão (Fase 9)**
7. ✅ **Documentar análise da página Configurações/Vínculos Professor (Fase 10)**
8. ⏳ **Executar migrations** para adicionar colunas `unit_id`
9. ⏳ **Atualizar código frontend e backend** para usar `unit_id`
10. ⏳ **Testar em ambiente de desenvolvimento** antes de produção

---

## Histórico de Alterações

| Data | Descrição |
|------|-----------|
| 2025-01-29 | Documento criado com plano inicial |
| 2025-01-29 | Adicionada análise detalhada da tela Home (Fase 5) |
| 2025-01-29 | Adicionada análise detalhada da tela Sincronizar Turmas (Fase 6) |
| 2025-01-29 | Adicionada análise detalhada da tela Calendário de Aulas (Fase 7) |
| 2025-01-29 | Adicionada análise detalhada da tela Abrindo Horizontes (Fase 8) |
| 2025-01-29 | Adicionada análise detalhada da tela Alertas de Evasão (Fase 9) |
| 2025-01-29 | Adicionada análise da página Configurações/Vínculos Professor (Fase 10) |

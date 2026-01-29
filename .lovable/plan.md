
## Fase 7: Tela Calendário de Aulas - Análise para Migração Multi-Unidades

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

### 7.4 Solução Proposta

#### 7.4.1 Atualizar RPC `get_lista_completa_reposicoes`

**Código atual:**
```sql
CREATE OR REPLACE FUNCTION get_lista_completa_reposicoes()
  RETURNS TABLE(...) AS ...
```

**Código novo:**
```sql
CREATE OR REPLACE FUNCTION get_lista_completa_reposicoes(
  p_unit_id uuid DEFAULT NULL
)
  RETURNS TABLE(...) AS ...
-- Adicionar WHERE r.unit_id = p_unit_id quando p_unit_id não for null
```

#### 7.4.2 Atualizar RPC `get_lista_aulas_experimentais`

**Código atual:**
```sql
CREATE OR REPLACE FUNCTION get_lista_aulas_experimentais()
  RETURNS TABLE(...) AS ...
```

**Código novo:**
```sql
CREATE OR REPLACE FUNCTION get_lista_aulas_experimentais(
  p_unit_id uuid DEFAULT NULL
)
  RETURNS TABLE(...) AS ...
-- Adicionar WHERE ae.unit_id = p_unit_id quando p_unit_id não for null
```

#### 7.4.3 Atualizar Hook `use-lista-reposicoes.ts`

**Alterações:**
- Receber `unitId` como parâmetro
- Passar `p_unit_id` para a RPC
- Incluir `unitId` na queryKey

**Código novo:**
```typescript
export const useListaReposicoes = (unitId?: string) => {
  const { data: reposicoes = [], ... } = useQuery({
    queryKey: ["lista-reposicoes", unitId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_lista_completa_reposicoes", {
        p_unit_id: unitId || null
      });
      ...
    },
  });
};
```

#### 7.4.4 Atualizar Hook `use-lista-aulas-experimentais.ts`

**Alterações:**
- Receber `unitId` como parâmetro
- Passar `p_unit_id` para a RPC
- Incluir `unitId` na queryKey

#### 7.4.5 Atualizar Hook `use-lista-faltas-futuras.ts`

**Alterações:**
- Receber `unitId` como parâmetro
- Adicionar filtro `.eq('unit_id', unitId)` na query
- Incluir `unitId` na queryKey

**Código novo:**
```typescript
export const useListaFaltasFuturas = (unitId?: string) => {
  return useQuery({
    queryKey: ["lista-faltas-futuras", unitId],
    queryFn: async () => {
      let query = supabase
        .from('faltas_antecipadas')
        .select(...)
        .eq('active', true);
      
      if (unitId) {
        query = query.eq('unit_id', unitId);
      }
      
      const { data, error } = await query.order('data_falta', { ascending: true });
      ...
    },
  });
};
```

#### 7.4.6 Atualizar Modais para Passar `unitId`

**Arquivos:**
- `ListaReposicoesModal.tsx` - Receber `unitId` via props e passar para hook
- `ListaAulasExperimentaisModal.tsx` - Receber `unitId` via props e passar para hook
- `ListaFaltasFuturasModal.tsx` - Receber `unitId` via props e passar para hook

**Em `CalendarioAulas.tsx`:**
- Passar `activeUnit?.id` como prop para cada modal

---

### 7.5 Banco de Dados

#### Tabelas - Status

| Tabela | unit_id | Ação necessária |
|--------|---------|-----------------|
| `turmas` | ✅ NOT NULL | Nenhuma |
| `eventos_sala` | ✅ NOT NULL | Nenhuma |
| `salas` | ✅ NOT NULL | Nenhuma |
| `reposicoes` | ✅ NOT NULL | Nenhuma |
| `aulas_experimentais` | ✅ NOT NULL | Nenhuma |
| `faltas_antecipadas` | ✅ NOT NULL | Nenhuma |

#### RPCs - Alterações Necessárias

**1. Atualizar `get_lista_completa_reposicoes`:**
```sql
DROP FUNCTION IF EXISTS get_lista_completa_reposicoes();

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
    -- ... resto do select ...
  FROM reposicoes r
  -- ... joins ...
  WHERE r.data_reposicao >= CURRENT_DATE
    AND (p_unit_id IS NULL OR r.unit_id = p_unit_id)
  ORDER BY r.data_reposicao ASC;
END;
$function$;
```

**2. Atualizar `get_lista_aulas_experimentais`:**
```sql
DROP FUNCTION IF EXISTS get_lista_aulas_experimentais();

CREATE OR REPLACE FUNCTION get_lista_aulas_experimentais(
  p_unit_id uuid DEFAULT NULL
)
RETURNS TABLE(...)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT ...
  FROM aulas_experimentais ae
  -- ... joins ...
  WHERE ae.active = true
    AND (p_unit_id IS NULL OR ae.unit_id = p_unit_id)
  ORDER BY ae.data_aula_experimental DESC, ae.cliente_nome ASC;
END;
$function$;
```

---

### 7.6 Checklist de Tarefas - Tela Calendário de Aulas

#### Banco de Dados (RPCs)
- [ ] Atualizar RPC `get_lista_completa_reposicoes`:
  - [ ] Adicionar parâmetro `p_unit_id uuid DEFAULT NULL`
  - [ ] Adicionar filtro `(p_unit_id IS NULL OR r.unit_id = p_unit_id)`

- [ ] Atualizar RPC `get_lista_aulas_experimentais`:
  - [ ] Adicionar parâmetro `p_unit_id uuid DEFAULT NULL`
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

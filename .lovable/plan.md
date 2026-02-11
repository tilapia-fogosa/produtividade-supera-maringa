

## Filtrar dados do Abrindo Horizontes por unidade ativa

### Contexto
As tabelas `ah_recolhidas` e `ah_ignorar_coleta` nao possuem coluna `unit_id`. Os alunos e funcionarios ja possuem `unit_id`. Precisamos filtrar 4 hooks.

### Estrategia
Seguindo o padrao ja usado no projeto (isolamento por heranca), vamos filtrar no frontend usando o `unit_id` da pessoa associada (aluno ou funcionario), ja que as queries desses hooks fazem JOINs com essas tabelas. Para a RPC `get_ah_tempo_stats`, vamos adicionar um parametro `p_unit_id` e filtrar via JOIN.

---

### Alteracoes

#### 1. Banco de Dados - Atualizar RPC `get_ah_tempo_stats`
- Dropar a funcao existente
- Recriar com parametro `p_unit_id uuid DEFAULT NULL`
- Adicionar JOIN com `alunos` e `funcionarios` para filtrar por `unit_id` quando informado
- Logica: verificar se `pessoa_id` pertence a um aluno ou funcionario da unidade

#### 2. Hook `use-apostilas-recolhidas.ts`
- Importar `useActiveUnit`
- Adicionar `activeUnit.id` na queryKey
- Apos buscar os detalhes de cada apostila, filtrar apenas os que pertencem a alunos/funcionarios com `unit_id` compativel
- Alternativa mais performatica: adicionar filtro `.eq('unit_id', activeUnit.id)` nas queries de alunos e funcionarios internas (so retorna match se o aluno pertence a unidade)

#### 3. Hook `use-proximas-coletas-ah.ts`
- Importar `useActiveUnit`
- Adicionar `activeUnit.id` na queryKey
- Adicionar `.eq('unit_id', activeUnit.id)` nas queries de alunos e funcionarios
- Desabilitar query enquanto `activeUnit` nao estiver carregado

#### 4. Hook `use-alunos-ignorados-ah.ts`
- Importar `useActiveUnit`
- Adicionar `activeUnit.id` na queryKey
- Nas sub-queries de alunos e funcionarios, adicionar `.eq('unit_id', activeUnit.id)` para filtrar
- Se a pessoa nao pertence a unidade ativa, excluir do resultado

#### 5. Hook `use-ah-tempo-stats.ts`
- Importar `useActiveUnit`
- Adicionar `activeUnit.id` na queryKey
- Passar `p_unit_id` para a RPC
- Desabilitar query enquanto `activeUnit` nao estiver carregado

---

### Detalhes tecnicos

**Migracao SQL para `get_ah_tempo_stats`:**
```sql
DROP FUNCTION IF EXISTS get_ah_tempo_stats();

CREATE OR REPLACE FUNCTION get_ah_tempo_stats(p_unit_id uuid DEFAULT NULL)
RETURNS TABLE(...) -- mesmos campos
-- Adicionar filtro WHERE na CTE apostilas_com_dados:
-- WHERE (p_unit_id IS NULL OR EXISTS (
--   SELECT 1 FROM alunos a WHERE a.id = ar.pessoa_id AND a.unit_id = p_unit_id
--   UNION ALL
--   SELECT 1 FROM funcionarios f WHERE f.id = ar.pessoa_id AND f.unit_id = p_unit_id
-- ))
```

**Padrao nos hooks frontend:**
```typescript
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

const { activeUnit } = useActiveUnit();

// Na queryKey:
queryKey: ['nome-query', activeUnit?.id],

// Desabilitar ate carregar:
enabled: !!activeUnit?.id,
```


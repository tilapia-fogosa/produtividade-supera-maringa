

## Fase 5: Ajustar Dashboard Home para Multi-Unidades

### Resumo

Tres hooks usados na Home precisam de filtragem por unidade ativa para evitar que admins vejam dados de todas as unidades misturados.

---

### Alteracao 1 - `use-camisetas.ts`

**Problema:** Busca todos os alunos ativos com 60+ dias sem filtrar por unidade.

**Solucao:** Adicionar `useActiveUnit()` e filtrar a query de alunos com `.eq('unit_id', activeUnit.id)`. Tambem adicionar `activeUnit?.id` como dependencia para re-executar ao trocar unidade.

Como a tabela `camisetas` nao tem `unit_id`, o filtro e aplicado na tabela `alunos` (que ja possui a coluna).

---

### Alteracao 2 - `use-pendencias-botom.ts`

**Problema:** Busca todas as pendencias de botom sem filtrar por unidade. As queries de enriquecimento (buscar nome do aluno, turma) tambem nao filtram.

**Solucao:** Adicionar `useActiveUnit()` e, ao enriquecer os dados, usar um JOIN ou filtro baseado no `alunos.unit_id`. A abordagem mais simples: buscar os alunos da unidade ativa primeiro, depois filtrar as pendencias pelos IDs desses alunos. Ou usar a relacao `aluno_id` para fazer um JOIN na query principal.

---

### Alteracao 3 - `use-professor-atividades.ts`

**Problema:** A chamada a RPC `get_lista_completa_reposicoes` na linha 118 nao passa o parametro `p_unit_id`, podendo retornar reposicoes de outras unidades.

**Solucao:** Importar `useActiveUnit()` e passar `p_unit_id: activeUnit?.id || null` na chamada da RPC.

---

### Detalhes Tecnicos

**use-camisetas.ts:**
```typescript
import { useActiveUnit } from '@/contexts/ActiveUnitContext';
const { activeUnit } = useActiveUnit();

// Na query de alunos, adicionar:
.eq('unit_id', activeUnit!.id)

// Re-executar ao trocar unidade:
useEffect(() => { buscarDadosCamisetas(); }, [activeUnit?.id]);
```

**use-pendencias-botom.ts:**
```typescript
import { useActiveUnit } from '@/contexts/ActiveUnitContext';
const { activeUnit } = useActiveUnit();

// queryKey inclui activeUnit?.id
// Usar JOIN com alunos para filtrar:
.select(`..., aluno:alunos!inner(nome, turma_id, unit_id)`)
.eq('aluno.unit_id', activeUnit!.id)
```

**use-professor-atividades.ts:**
```typescript
import { useActiveUnit } from '@/contexts/ActiveUnitContext';
const { activeUnit } = useActiveUnit();

// Passar unit_id na RPC:
const { data: reposicoes } = await supabase
  .rpc('get_lista_completa_reposicoes', {
    p_incluir_anteriores: false,
    p_unit_id: activeUnit?.id || null
  });
```

---

### Impacto

Essas 3 alteracoes completam a Fase 5 do roadmap de migracao multi-unidades, garantindo que o Dashboard Home exiba apenas dados da unidade ativa selecionada.


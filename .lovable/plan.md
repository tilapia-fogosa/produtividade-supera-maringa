

## Plano: Corrigir Cálculo de Vagas no Calendário de Aulas

### Problema Identificado

**Cálculo Atual (incorreto):**
```typescript
vagasDisponiveis = 12 - total_alunos_ativos - total_funcionarios_ativos
```

**Cálculo Correto:**
```
Vagas = 12 - (alunos ativos) - (funcionários ativos) - (reposições no dia) - (aulas experimentais no dia) + (faltas futuras no dia)
```

### Análise Técnica

Existem **dois problemas**:

1. **Frontend** - O cálculo de vagas não inclui reposições, aulas experimentais e faltas futuras

2. **Backend (RPC)** - A função `get_calendario_eventos_unificados` lê de uma view que retorna valores **fixos (0)** para reposições, aulas experimentais e faltas futuras

| Componente | Status |
|------------|--------|
| `vw_calendario_eventos_unificados` | ❌ Retorna 0 fixo para reposições/experimentais/faltas |
| `get_calendario_eventos_unificados` | ❌ Não recebe parâmetros de data para cálculo dinâmico |
| `get_calendario_turmas_semana_com_reposicoes` | ✅ Calcula corretamente por período |
| Frontend (cálculo vagas) | ❌ Não usa todos os campos na fórmula |

---

### Solução

#### Parte 1: Atualizar a RPC do Banco de Dados

Modificar `get_calendario_eventos_unificados` para calcular dinamicamente os valores de reposições, aulas experimentais e faltas futuras usando os parâmetros `p_data_inicio` e `p_data_fim` que já recebe mas não utiliza.

**SQL para atualizar:**
```sql
CREATE OR REPLACE FUNCTION public.get_calendario_eventos_unificados(
  p_data_inicio date, 
  p_data_fim date, 
  p_unit_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(...)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH reposicoes_por_turma AS (
    SELECT turma_id, COUNT(*) as total
    FROM reposicoes
    WHERE data_reposicao BETWEEN p_data_inicio AND p_data_fim
    GROUP BY turma_id
  ),
  aulas_experimentais_por_turma AS (
    SELECT turma_id, COUNT(*) as total
    FROM aulas_experimentais
    WHERE data_aula_experimental BETWEEN p_data_inicio AND p_data_fim
      AND active = true
    GROUP BY turma_id
  ),
  faltas_futuras_por_turma AS (
    SELECT a.turma_id, COUNT(*) as total
    FROM faltas_antecipadas fa
    JOIN alunos a ON fa.aluno_id = a.id
    WHERE fa.data_falta BETWEEN p_data_inicio AND p_data_fim
      AND fa.active = true
      AND a.active = true
    GROUP BY a.turma_id
  )
  SELECT 
    vce.evento_id,
    vce.tipo_evento,
    vce.unit_id,
    vce.dia_semana,
    vce.horario_inicio,
    vce.horario_fim,
    vce.sala_id,
    vce.sala_nome,
    vce.sala_cor,
    vce.titulo,
    vce.descricao,
    vce.professor_id,
    vce.professor_nome,
    vce.professor_slack,
    vce.perfil,
    vce.data_especifica,
    vce.total_alunos_ativos,
    vce.total_funcionarios_ativos,
    COALESCE(rpt.total, 0)::integer as total_reposicoes,
    COALESCE(aept.total, 0)::integer as total_aulas_experimentais,
    COALESCE(ffpt.total, 0)::integer as total_faltas_futuras,
    vce.created_at
  FROM vw_calendario_eventos_unificados vce
  LEFT JOIN reposicoes_por_turma rpt ON rpt.turma_id = vce.evento_id::uuid
  LEFT JOIN aulas_experimentais_por_turma aept ON aept.turma_id = vce.evento_id::uuid
  LEFT JOIN faltas_futuras_por_turma ffpt ON ffpt.turma_id = vce.evento_id::uuid
  WHERE (p_unit_id IS NULL OR vce.unit_id = p_unit_id);
END;
$$;
```

---

#### Parte 2: Atualizar Cálculo no Frontend

| Arquivo | Mudança |
|---------|---------|
| `src/pages/CalendarioAulas.tsx` | Atualizar fórmula de vagas em `BlocoTurma` |

**De:**
```typescript
const vagasDisponiveis = Math.max(0, 
  capacidadeMaxima - evento.total_alunos_ativos - evento.total_funcionarios_ativos
);
```

**Para:**
```typescript
const vagasDisponiveis = Math.max(0, 
  capacidadeMaxima 
  - evento.total_alunos_ativos 
  - evento.total_funcionarios_ativos 
  - evento.total_reposicoes 
  - evento.total_aulas_experimentais 
  + evento.total_faltas_futuras
);
```

---

### Lógica do Cálculo

| Fator | Operação | Motivo |
|-------|----------|--------|
| Alunos ativos | `-` | Ocupam vagas fixas |
| Funcionários ativos | `-` | Ocupam vagas fixas |
| Reposições no dia | `-` | Aluno de outra turma vem ocupar vaga |
| Aulas experimentais | `-` | Cliente potencial vem experimentar |
| Faltas futuras | `+` | Aluno avisou que não vai, libera vaga |

---

### Resultado Esperado

Após a implementação, o calendário mostrará vagas considerando a situação real de cada turma no dia específico, contabilizando:
- Alunos extras por reposição
- Clientes em aula experimental  
- Vagas liberadas por faltas avisadas antecipadamente


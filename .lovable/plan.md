

# Corrigir RPC: Responsável = Professor da Turma

## Problema
A RPC `get_lista_aulas_experimentais` tenta resolver o responsável pelo `responsavel_id` e `responsavel_tipo` da tabela `aulas_experimentais`. Quando o tipo é `'usuario'`, não encontra ninguém e mostra "Não identificado".

## Solução
Simplificar a RPC para sempre buscar o professor da turma via `turmas.professor_id → professores.nome`, ignorando completamente os campos `responsavel_id` e `responsavel_tipo`.

## Migration SQL

```sql
CREATE OR REPLACE FUNCTION get_lista_aulas_experimentais(p_unit_id uuid DEFAULT NULL)
RETURNS TABLE(
  aula_experimental_id uuid,
  data_aula_experimental date,
  cliente_nome text,
  responsavel_nome text,
  responsavel_tipo text,
  descricao_cliente text,
  turma_nome text,
  unit_id uuid,
  turma_id uuid,
  responsavel_id uuid
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ae.id as aula_experimental_id,
    ae.data_aula_experimental,
    ae.cliente_nome,
    COALESCE(prof.nome, 'Não identificado') as responsavel_nome,
    'professor'::text as responsavel_tipo,
    ae.descricao_cliente,
    t.nome as turma_nome,
    ae.unit_id,
    ae.turma_id,
    t.professor_id as responsavel_id
  FROM aulas_experimentais ae
  JOIN turmas t ON ae.turma_id = t.id
  LEFT JOIN professores prof ON t.professor_id = prof.id
  WHERE ae.active = true
    AND (p_unit_id IS NULL OR ae.unit_id = p_unit_id)
  ORDER BY ae.data_aula_experimental DESC, ae.cliente_nome ASC;
END;
$$;
```

### O que muda
- Remove os LEFT JOINs com `funcionarios` e o antigo JOIN com `professores` via `responsavel_id`
- Faz JOIN direto `turmas.professor_id → professores.id` para pegar o nome do professor da turma
- Retorna sempre `'professor'` como `responsavel_tipo`
- Retorna `t.professor_id` como `responsavel_id`
- Usa `COALESCE` para fallback caso a turma não tenha professor

### O que NÃO muda
- Nenhuma alteração no frontend
- A assinatura da função (parâmetros e colunas retornadas) permanece idêntica
- Nenhuma alteração na edge function de registro


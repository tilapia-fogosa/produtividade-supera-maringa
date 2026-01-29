

# Plano: Habilitar RLS e Marcar Fases 1 e 2 como Concluídas

## Resumo

Este plano cobre duas ações: habilitar o RLS na tabela `produtividade_ah` e atualizar o documento de migração marcando as Fases 1 e 2 como concluídas.

---

## Ações a Executar

### 1. Habilitar RLS na tabela `produtividade_ah`

Executar o seguinte comando SQL via migration:

```sql
ALTER TABLE produtividade_ah ENABLE ROW LEVEL SECURITY;
```

**Por que é necessário:** A tabela já possui as políticas RLS configuradas corretamente, mas o RLS está desabilitado (`relrowsecurity: false`). Habilitar o RLS ativa a proteção multi-unidades.

---

### 2. Atualizar `MIGRACAO_MULTI_UNIDADES.md`

Marcar as Fases 1 e 2 como **CONCLUÍDAS** com a seguinte justificativa:

- **Status:** ✅ Implementada por Design
- **Justificativa:** 
  - Ambas as tabelas (`produtividade_abaco` e `produtividade_ah`) herdam o isolamento multi-unidades através do vínculo com `pessoa_id`
  - As pessoas (alunos/funcionários) já possuem `unit_id`
  - As políticas RLS já fazem JOIN para verificar acesso via `user_has_access_to_unit(unit_id)`
  - Não é necessário adicionar coluna `unit_id` diretamente nas tabelas de produtividade

---

## Detalhes Técnicos

### Arquitetura de Isolamento Existente

```
produtividade_abaco/ah
        │
        └── pessoa_id ──► alunos/funcionarios
                                │
                                └── unit_id ──► units
```

### Políticas RLS Existentes

As políticas já verificam o acesso através de:
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

---

## Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| `MIGRACAO_MULTI_UNIDADES.md` | Atualizar status das Fases 1 e 2 para "Concluída" |

## Migração SQL

| Tabela | Comando |
|--------|---------|
| `produtividade_ah` | `ALTER TABLE produtividade_ah ENABLE ROW LEVEL SECURITY;` |


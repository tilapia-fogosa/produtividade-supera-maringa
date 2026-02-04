

## Plano: Remover Chamadas Duplicadas de Conclusão

### Problema Identificado

O código está chamando **duas funções que concluem a mesma atividade**:

1. `concluirTarefa(atividadeAcolhimento.id)` - Conclui e dispara webhook com `atividades_criadas: []`
2. `criarAtividade({ atividadeAnteriorId: atividadeAcolhimento.id })` - Também conclui a atividade anterior internamente e dispara webhook com a nova atividade

**Resultado:** Dois webhooks são disparados para a mesma conclusão.

---

### Solução

Remover as chamadas de `concluirTarefa()` que precedem `criarAtividade()` quando já passamos `atividadeAnteriorId`, pois a função `criarAtividadeMutation` já faz a conclusão da atividade anterior internamente.

---

### Arquivo a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/alerta-evasao/AtividadesDrawer.tsx` | Remover chamadas redundantes de `concluirTarefa` |

---

### Mudanças Específicas

**1. Função `handleProsseguirAcolhimento` (linhas 409-411):**
```text
Remover: await concluirTarefa(atividadeAcolhimento.id);
Motivo: criarAtividade já conclui a atividade anterior via atividadeAnteriorId
```

**2. Função `handleConfirmarAtendimentoFinanceiro` (linhas 467-469):**
```text
Remover: await concluirTarefa(atividadeAcolhimento.id);
Motivo: criarAtividade já conclui a atividade anterior via atividadeAnteriorId
```

---

### Fluxo Corrigido

```text
ANTES (bug):
1. concluirTarefa() → webhook com atividades_criadas: []
2. criarAtividade() → webhook com atividades_criadas: [nova]

DEPOIS (correto):
1. criarAtividade({ atividadeAnteriorId }) → webhook único com atividades_criadas: [nova]
```

---

### Resultado Esperado

Apenas **um webhook** será disparado quando uma atividade é concluída e gera uma nova, contendo:

```json
{
  "evento": "atividade_concluida",
  "atividade_concluida": { ... },
  "atividades_criadas": [{ ... }],
  "contexto": "transicao_atividade"
}
```


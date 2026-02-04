

## Plano: Unificar Webhook para Apenas Um Formato

### Problema Identificado

O código atual envia **dois webhooks separados** quando uma atividade é concluída e gera novas atividades:

1. `enviarAtividadeParaWebhook` - Chamado para cada nova atividade individual (formato `atividade:`)
2. `enviarConclusaoParaWebhook` - Chamado após conclusão (formato `atividade_concluida:` + `atividades_criadas:`)

O payload que você está recebendo (`atividade:`) vem da primeira função, não do formato unificado.

---

### Solução

Remover todas as chamadas de `enviarAtividadeParaWebhook` quando há uma atividade sendo concluída e manter **apenas** a chamada de `enviarConclusaoParaWebhook` com o formato unificado.

---

### Arquivo a Modificar

| Arquivo | Ação |
|---------|------|
| `src/hooks/use-atividades-alerta-evasao.ts` | Remover chamadas duplicadas de `enviarAtividadeParaWebhook` |

---

### Mudanças Específicas

**1. No `criarAtividadeMutation` (quando é evasão com tarefas - linhas 498-506):**
- Remover a chamada `enviarAtividadeParaWebhook` dentro do loop de tarefas de evasão
- Manter apenas `enviarConclusaoParaWebhook` que já envia todas as atividades criadas

**2. No `criarAtividadeMutation` (criação normal - linhas 627-636):**
- Remover a chamada `enviarAtividadeParaWebhook` para a atividade criada
- Manter apenas `enviarConclusaoParaWebhook` quando há atividade anterior

**3. No `processarNegociacaoMutation` (linhas 792-799 e similares):**
- Remover chamadas `enviarAtividadeParaWebhook` individuais
- Garantir que todas as atividades criadas sejam incluídas no array `atividadesCriadas`
- Enviar apenas o webhook unificado de conclusão

**4. No `concluirTarefaMutation`:**
- Verificar se há chamadas `enviarAtividadeParaWebhook` e remover
- Manter formato unificado

---

### Resultado Esperado

Quando uma atividade é concluída e gera novas atividades, será enviado **apenas um webhook** com o seguinte formato:

```json
{
  "evento": "atividade_concluida",
  "atividade_concluida": {
    "id": "...",
    "tipo_atividade": "acolhimento",
    "tipo_label": "Acolhimento",
    "descricao": "...",
    "responsavel_nome": "André do Valle",
    "concluido_por_nome": "André do Valle"
  },
  "atividades_criadas": [
    {
      "id": "...",
      "tipo_atividade": "contato_financeiro",
      "tipo_label": "Contato Financeiro",
      "descricao": "...",
      "responsavel_nome": "Administrativo",
      "status": "pendente",
      "data_agendada": "2026-02-25",
      "departamento_responsavel": "administrativo"
    }
  ],
  "contexto": "transicao_atividade",
  "alerta": { ... },
  "aluno": { ... },
  "turma": { ... },
  "professor": { ... },
  "concluido_em": "2026-02-04T11:54:05.654Z"
}
```

---

### Caso Especial: Criação Inicial de Atividade

Quando uma atividade é criada **sem** concluir uma anterior (primeira atividade do alerta), continuaremos usando `enviarAtividadeParaWebhook` pois não há contexto de conclusão.




## Plano: Corrigir Payload do Webhook de Conclusão

### Problema Identificado

1. **Descritivo da atividade concluída** estava vindo da atividade salva no banco (antes de atualizar), não do descritivo que o usuário preencheu ao concluir
2. **Próximas atividades** estavam recebendo o descritivo das observações, quando na verdade não devem ter descritivo (ainda não foram realizadas)

---

### Solução Implementada

1. Adicionado parâmetro `observacoesAtividadeAnterior` no mutation `criarAtividadeMutation`
2. Ao concluir uma atividade, atualizamos o banco com o descritivo fornecido pelo usuário
3. O webhook envia o descritivo correto da atividade concluída
4. Removido `descricao` da interface `AtividadeCriada` (próximas atividades não têm descritivo)

---

### Arquivos Modificados

| Arquivo | Ação |
|---------|------|
| `src/hooks/use-atividades-alerta-evasao.ts` | Adicionado parâmetro e lógica para separar descritivos |
| `src/components/alerta-evasao/AtividadesDrawer.tsx` | Atualizado para passar `observacoesAtividadeAnterior` |

---

### Payload Corrigido

```json
{
  "evento": "atividade_concluida",
  "atividade_concluida": {
    "id": "...",
    "tipo_atividade": "acolhimento",
    "descricao": "Observações preenchidas pelo usuário ao concluir"
  },
  "atividades_criadas": [
    {
      "id": "...",
      "tipo_atividade": "atendimento_financeiro",
      "tipo_label": "Atendimento Financeiro",
      "responsavel_nome": "Administrativo",
      "status": "pendente",
      "data_agendada": "2026-02-10"
      // Sem descricao - ainda não foi realizada
    }
  ]
}
```

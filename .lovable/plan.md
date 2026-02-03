
## Plano: Incluir ID do Alerta de Evasão no Webhook de Criação

### Situação Atual

O webhook do n8n é chamado **antes** de inserir o registro no banco de dados:

```text
Fluxo Atual:
1. Envia para n8n ❌ (sem ID)
2. Insere no banco → Obtém ID
3. Envia para Make ❌ (sem ID)
```

### Solução

Reorganizar a ordem das operações para primeiro inserir no banco e depois enviar aos webhooks:

```text
Fluxo Proposto:
1. Insere no banco → Obtém ID ✅
2. Envia para n8n ✅ (com ID)
3. Envia para Make ✅ (com ID)
```

---

### Arquivo a Modificar

| Arquivo | Ação |
|---------|------|
| `src/hooks/use-alertas-evasao.ts` | Reordenar operações e incluir `alerta_id` nos payloads |

---

### Detalhes Técnicos

**Mudanças no `handleSubmit`:**

1. Mover a inserção no banco (linhas 242-266) para **antes** das chamadas aos webhooks

2. Adicionar o `alerta_id` no payload do webhook n8n:
```typescript
body: JSON.stringify({
  alerta_id: alertaData.id,  // ← Novo campo
  aluno_id: alunoSelecionado,
  turma_id: aluno?.turma_id || null,
  professor_id: professorId,
  data_aviso: dataAlerta,
  responsavel_id: profileId,
  descricao: descritivo,
  origem: origemAlerta
})
```

3. Adicionar o `alerta_id` no payload do webhook Make:
```typescript
body: JSON.stringify({
  aluno: { ... },
  alerta: {
    id: alertaData.id,  // ← Novo campo
    data: dataAlertaFormatada,
    origem: origemAlerta,
    ...
  }
})
```

---

### Resultado Esperado

Ambos os webhooks (n8n e Make) receberão o `alerta_id` do registro criado, permitindo:
- Rastreabilidade completa do alerta
- Links diretos para o registro no sistema
- Atualizações futuras baseadas no ID

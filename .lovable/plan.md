

## Diagnóstico - WhatsApp Comercial: Envio de Mensagens

### O que está acontecendo

Existem **2 problemas reais**, e nenhum envolve dados mock (o WhatsApp Comercial já usa dados reais do banco).

---

### Problema 1: Mensagens enviadas NÃO aparecem no chat

A edge function `send-whatsapp-message` tenta salvar a mensagem na tabela `historico_comercial`, mas o **insert falha** porque está tentando gravar em **colunas que não existem** na tabela.

A tabela `historico_comercial` tem estas colunas:
```text
id, created_at, client_id (UUID), mensagem, from_me, created_by (UUID),
lida, lida_em, tipo_mensagem, telefone, unit_id, media_url
```

Mas o código tenta inserir:
```text
tipo_acao       → NÃO EXISTE na tabela
descricao       → NÃO EXISTE na tabela
profile_id      → NÃO EXISTE (o campo correto é "created_by")
```

Além disso, o `client_id` é do tipo **UUID**, mas o código envia o **número de telefone** (ex: `"5544999679947"`), causando o erro:
> `invalid input syntax for type uuid: "5544999679947"`

**Resultado**: o insert falha silenciosamente, a mensagem chega pro cliente via webhook mas nunca é salva no banco, então nunca aparece no chat.

---

### Problema 2: Delay no envio

O fluxo atual é **sequencial**:
1. Chama `replace-message-variables` (edge function) → espera resposta
2. Depois chama `send-whatsapp-message` → espera resposta

"Cold start" = quando uma edge function não é usada há um tempo, o servidor precisa "ligar" ela do zero antes de processar. Isso adiciona alguns segundos extras. Como são **duas funções em sequência**, o delay se acumula.

Solução simples: se a mensagem não contém `{` (nenhuma variável), **pular** a chamada ao `replace-message-variables` e ir direto para o envio.

---

### Plano de Correção

**1. Corrigir o insert na edge function `send-whatsapp-message`**
- Remover colunas inexistentes: `tipo_acao`, `descricao`
- Trocar `profile_id` por `created_by`
- Quando `client_id` não for UUID válido (ex: número de telefone), enviar `null` no `client_id` e salvar o telefone no campo `telefone`

**2. Eliminar delay desnecessário no `ChatInput.tsx`**
- Se a mensagem não contém `{`, pular a chamada ao `replace-message-variables` e usar a mensagem original direto
- Isso elimina uma chamada de rede inteira na maioria dos envios


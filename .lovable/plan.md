

## Plano: Responder e Reagir a Mensagens no WhatsApp Comercial

A tabela `whatsapp_message_reactions` já foi criada no banco com as colunas: `id`, `historico_comercial_id` (bigint), `tipo` (reacao/resposta), `emoji`, `mensagem_resposta`, `profile_id`, `profile_name`, `created_at`.

### Etapas de Implementação

**1. Criar componente `MessageActionMenu`**
- Ao clicar em uma mensagem (`ChatMessage`), exibe um mini popover com 2 opções: "Responder" e "Reagir"
- Se clicar em "Reagir": exibe os 6 emojis padrão do WhatsApp (👍 ❤️ 😂 😮 😢 🙏) + botão "+" que abre o emoji-picker completo
- Se clicar em "Responder": seta a mensagem como "replyTo" via callback para o `ChatArea`
- Inserção na tabela `whatsapp_message_reactions` para reações (tipo=reacao, emoji preenchido)

**2. Adicionar estado `replyingTo` no `ChatArea`**
- Estado controlado em `ChatArea` que armazena a mensagem sendo respondida
- Passa `onReply` callback para `ChatMessages` → `ChatMessage`
- Passa `replyingTo` + `onCancelReply` para `ChatInput`

**3. Modificar `ChatInput` para exibir barra de resposta**
- Quando `replyingTo` está setado, exibe uma barra acima do input com:
  - Borda lateral colorida (estilo WhatsApp)
  - Nome do remetente + trecho da mensagem
  - Botão X para cancelar
- Ao enviar, inclui referência à mensagem original (salva na tabela `whatsapp_message_reactions` com tipo=resposta)

**4. Modificar `ChatMessages` para propagar callbacks**
- Passa `onReply` e `onReact` para cada `ChatMessage`

**5. Atualizar `useMessages` para carregar reações**
- Após buscar mensagens, faz query nas `whatsapp_message_reactions` para enriquecer cada mensagem com suas reações
- As reações já são renderizadas pelo `ChatMessage` existente (campo `message.reactions`)

**6. Criar Edge Function `react-whatsapp-message`**
- Recebe: `historico_comercial_id`, `tipo`, `emoji`, `profile_id`, `profile_name`
- Insere na tabela `whatsapp_message_reactions`
- Opcionalmente envia reação via webhook WhatsApp

### Detalhes Técnicos

- O `MessageActionMenu` será um Popover posicionado junto ao balão da mensagem
- Reações são salvas localmente + enviadas via webhook (fire-and-forget)
- Respostas criam um registro na tabela de referência E enviam a mensagem normalmente via `send-whatsapp-message`
- O hook `useMessages` será atualizado para fazer LEFT JOIN ou query separada nas reactions


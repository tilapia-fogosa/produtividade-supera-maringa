

## Plano: Remover `getUser()` e usar AuthContext no ChatInput

### Mudança única: `src/pages/whatsapp-comercial/components/ChatInput.tsx`

1. Importar `useAuth` de `@/contexts/AuthContext`
2. No componente, extrair `{ user, profile }` do `useAuth()`
3. No `handleSendMessage`:
   - Remover toda chamada a `supabase.auth.getUser()`
   - Usar `user?.id` para `profile_id`
   - Usar `profile?.full_name || user?.email || 'Usuário'` para `userName`
   - Simplificar o bloco de variáveis: se tem `{`, chamar só `replace-message-variables` (sem Promise.all com getUser)
   - Mover `setMessage("")` para **antes** do `await` da edge function (fire-and-forget no input)
4. `conversation.unitId` continua sendo passado normalmente — não muda nada

**Resultado**: input libera instantaneamente, ~200-500ms a menos por mensagem, mesma funcionalidade.


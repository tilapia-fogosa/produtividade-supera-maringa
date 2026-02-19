
# Correção: Transcrição de áudio não funciona

## Problema
A edge function `transcribe-audio` tenta ler a secret com o nome `'OpenAI Whisper'`, mas a secret configurada no projeto se chama `OPENAI_API_KEY`. Isso faz com que a chave da API seja `undefined` e a transcrição falhe.

## Solução
Alterar uma única linha na edge function para usar o nome correto da secret.

## Detalhes Tecnicos

### Arquivo: `supabase/functions/transcribe-audio/index.ts`

**Linha 14 - De:**
```typescript
const OPENAI_API_KEY = Deno.env.get('OpenAI Whisper');
```

**Para:**
```typescript
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
```

**Linha 16 - Atualizar mensagem de erro (opcional):**
```typescript
throw new Error('OPENAI_API_KEY secret is not configured');
```

Apos a alteracao, a edge function sera reimplantada automaticamente.

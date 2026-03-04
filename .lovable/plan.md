

## Plano: Corrigir insert do cadastro de lead

### Problema
O erro `Could not find the 'obs' column of 'clients'` ocorre porque o código usa `obs` no insert, mas a coluna real na tabela é `observations`.

### Correção

**Arquivo:** `src/pages/whatsapp-comercial/components/NewClientDrawer.tsx`
- Na função `onSubmit`, trocar `obs: values.observations || null` para `observations: values.observations || null` no objeto de insert.

Linha ~120:
```typescript
// DE:
obs: values.observations || null,

// PARA:
observations: values.observations || null,
```

Essa é a única mudança necessária.


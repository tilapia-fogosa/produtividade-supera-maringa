

## Plano: Formatar data de correção AH como DD/MM/YYYY

### Problema
O campo `data_fim_correcao` é `timestamptz` e a função `formatDate` concatena `T12:00:00` ao valor, o que causa problemas pois o valor já contém horário.

### Alteração
Na função `formatDate` em `DiariosSaoRafael.tsx` (linha 65), remover a concatenação de `T12:00:00` e usar `new Date(dateStr)` diretamente, pois timestamps completos já são parseados corretamente:

```typescript
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-';
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return dateStr;
  }
};
```

Isso garante que tanto datas simples (`2024-05-10`) quanto timestamps (`2024-05-10T15:30:00.000Z`) sejam formatados como `DD/MM/YYYY`.


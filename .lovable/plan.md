

## Correção: Filtrar histórico de sincronizações pela unidade ativa

### Problema
O hook `useUltimaSincronizacao` aplica o filtro `unit_id` de forma condicional (`if (activeUnit?.id)`). Quando a unidade ativa ainda não carregou, a query retorna dados de todas as unidades, fazendo com que Londrina veja sincronizações de Maringá.

### Solução
Modificar o hook para:
1. **Desabilitar a query** enquanto `activeUnit` não estiver definido (usando `enabled`)
2. **Sempre aplicar** o filtro `unit_id` (removendo o `if`)

### Arquivo a alterar

**`src/hooks/use-ultima-sincronizacao.ts`**
- Adicionar `enabled: !!activeUnit?.id` nas opções da query para não executar sem unidade
- Remover o `if` condicional e sempre aplicar `.eq('unit_id', activeUnit.id)`

### Detalhes técnicos

```typescript
return useQuery({
  queryKey: ["ultimas-sincronizacoes", activeUnit?.id],
  queryFn: async () => {
    let query = supabase
      .from('data_imports')
      .select('*')
      .eq('import_type', 'turmas-xls')
      .eq('status', 'completed')
      .eq('unit_id', activeUnit!.id)  // sempre filtra
      .order('created_at', { ascending: false })
      .limit(10);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
  enabled: !!activeUnit?.id,  // só executa com unidade definida
  refetchInterval: 30000,
});
```


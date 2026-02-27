

## Plano: Filtrar AH por `data_fim_correcao` em vez de `created_at`

### Alteração
No arquivo `src/hooks/use-diarios-sao-rafael.ts`, linhas 59-65, trocar o filtro da query de AH de `created_at` para `data_fim_correcao`, e ordenar por `data_fim_correcao`:

```typescript
supabase
  .from('produtividade_ah')
  .select('id, apostila, exercicios, erros, professor_correcao, comentario, data_fim_correcao, created_at')
  .eq('pessoa_id', alunoId)
  .gte('data_fim_correcao', `${dataInicial}T00:00:00.000Z`)
  .lte('data_fim_correcao', `${dataFinal}T23:59:59.999Z`)
  .order('data_fim_correcao', { ascending: true })
```

Registros sem `data_fim_correcao` (null) serão automaticamente excluídos pelo filtro `gte`/`lte`.


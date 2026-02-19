
# Corrigir exibicao de nomes duplicados nas Aulas Inaugurais

## Problema

O dashboard mostra o mesmo nome para duas aulas inaugurais do mesmo cliente porque o hook `use-aulas-inaugurais-professor.ts` busca o nome usando `client_id` como chave. Quando existem 2 matriculas para o mesmo `client_id`, o mapa `clienteNomes` sobrescreve o valor e ambas ficam com o mesmo nome.

Por exemplo:
- Atividade `b30f5e41` tem `full_name = "teste 4"`
- Atividade `7cfbb1ba` tem `full_name = "teste 4.4"`
- Mas ambas mostram "teste 4" porque o mapa usa `client_id` como chave

## Solucao

Trocar a logica de busca de nomes para usar `atividade_pos_venda_id` como chave em vez de `client_id`. Buscar o `full_name` diretamente pelo ID da atividade.

## Arquivo modificado

`src/hooks/use-aulas-inaugurais-professor.ts`

### Mudancas

1. **Busca de nomes (bloco admin)**: Em vez de buscar atividades por `.in('client_id', clientIds)`, buscar por `.in('id', atividadeIds)` e montar o mapa com `atividade.id` como chave
2. **Busca de nomes (bloco professor)**: Mesma mudanca
3. **Mapeamento do nome**: Trocar `clienteNomes[(e as any).client_id]` por `clienteNomes[(e as any).atividade_pos_venda_id]`

### Logica atual

```text
// Busca por client_id (sobrescreve quando ha duplicatas)
const clientIds = eventos.map(e => e.client_id).filter(Boolean);
const { data: clientes } = await supabase
  .from('atividade_pos_venda')
  .select('client_id, client_name, full_name')
  .in('client_id', clientIds);

clientes.forEach(c => {
  clienteNomes[c.client_id] = c.full_name || c.client_name;
});
```

### Logica corrigida

```text
// Busca por atividade_pos_venda_id (unico por matricula)
const atividadeIds = eventos.map(e => e.atividade_pos_venda_id).filter(Boolean);
const { data: atividades } = await supabase
  .from('atividade_pos_venda')
  .select('id, client_name, full_name')
  .in('id', atividadeIds);

atividades.forEach(a => {
  clienteNomes[a.id] = a.full_name || a.client_name;
});

// No mapeamento:
cliente_nome: clienteNomes[(e as any).atividade_pos_venda_id] || undefined
```

Isso garante que cada aula inaugural mostra o nome correto da matricula especifica, mesmo quando o mesmo cliente tem multiplas vendas.

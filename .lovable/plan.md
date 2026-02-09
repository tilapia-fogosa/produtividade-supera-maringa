

## Exibir `full_name` ao inves de `client_name` na aba Atividades Pos-Venda

Atualmente a coluna "Nome" na tabela de Atividades Pos-Venda exibe o campo `client_name`. A alteracao fara com que o sistema priorize o campo `full_name` e use `client_name` apenas como fallback.

---

### Alteracoes necessarias

**1. Hook `src/hooks/use-atividades-pos-venda.ts`**

- Adicionar `full_name` a interface `AtividadePosVenda` (campo opcional: `full_name?: string | null`)
- No mapeamento dos resultados, definir `client_name` com a logica: `pv.full_name || pv.client_name || "Sem nome"`
- O campo `full_name` ja esta sendo buscado no select da query, entao nao precisa alterar a consulta

**2. Nenhuma alteracao no componente `AtividadesPosVendaTab.tsx`**

- O componente ja exibe `atividade.client_name`, que passara a conter o valor correto apos a mudanca no hook

---

### Resumo tecnico

Apenas uma linha precisa ser alterada no hook, na linha onde o `client_name` e atribuido no `return` do `.map()`:

```
// De:
client_name: pv.client_name || "Sem nome",

// Para:
client_name: pv.full_name || pv.client_name || "Sem nome",
```


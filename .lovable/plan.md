

## Plano: Corrigir visibilidade das aulas inaugurais na Home

### Problema diagnosticado

1. **Migração incompleta**: dos 4 registros em `eventos_professor` com `tipo_evento = 'aula_zero'`, apenas 1 foi migrado para `aulas_inaugurais`. Os outros 3 tinham `atividade_pos_venda_id = NULL`, e a condição `AND apv.unit_id IS NOT NULL` no SQL de migração os excluiu.

2. **Data fora da janela**: o unico registro migrado (2026-03-19) esta 2+ semanas no futuro. A Home so exibe "Hoje", "Esta Semana" (ate 08/03) e "Proxima Semana" (09-15/03).

### Correções

**1. Remigrar registros faltantes (SQL)**
- Inserir os 3 registros de `eventos_professor` que ficaram de fora, usando `unit_id` de Maringá como fallback (todos os dados estão nessa unidade)
- Para registros sem `client_id`, tratar como NULL (campo é NOT NULL na tabela -- precisará ajustar a constraint ou buscar o client_id de outra forma)

**2. Ajustar constraint `client_id NOT NULL`**
- Tornar `client_id` nullable na tabela `aulas_inaugurais`, pois existem eventos de aula_zero legados sem client_id vinculado

**3. Ampliar janela de exibição na Home**
- Atualmente a Home filtra em 3 faixas: hoje, esta semana, próxima semana
- Alterar o hook para buscar aulas inaugurais dos próximos 30 dias (em vez de depender apenas das seções da Home)
- OU criar uma seção "Próximas Aulas Inaugurais" separada que mostre todas as pendentes independente da data

### Arquivos impactados

| Arquivo | Ação |
|---|---|
| Migração SQL | Ajustar `client_id` para nullable + inserir registros faltantes |
| `use-aulas-inaugurais-professor.ts` | Remover filtro `.gte('data', hojeStr)` ou ampliar para 30 dias |
| `Home.tsx` | Opcionalmente criar seção dedicada para aulas inaugurais futuras |


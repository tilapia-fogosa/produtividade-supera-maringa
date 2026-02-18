
## Corrigir Filtro de Unidade no Agendamento de Aula Inaugural

### Problema
O componente `AulaInauguralSelector.tsx` usa um UUID fixo de Maringa (hardcoded) para buscar horarios e professores disponiveis. Isso faz com que usuarios de outras unidades (ex: Londrina) vejam dados de Maringa.

### Solucao
Substituir o UUID fixo pelo ID da unidade ativa do contexto (`useActiveUnit`).

### Alteracoes

**Arquivo: `src/components/painel-administrativo/AulaInauguralSelector.tsx`**

1. Importar `useActiveUnit` de `@/contexts/ActiveUnitContext`
2. Remover a constante `MARINGA_UNIT_ID`
3. Obter `activeUnit` via hook: `const { activeUnit } = useActiveUnit()`
4. Substituir todas as referencias a `MARINGA_UNIT_ID` por `activeUnit?.id`

Sao apenas 2 pontos onde o UUID e usado:
- Na chamada de `useHorariosDisponiveisSalas` (linha ~56)
- Na chamada de `useProfessoresDisponiveis` (linha ~62)



## Plano: Abrir drawer de histórico de atividades ao clicar em atendimento na Agenda

### Situação atual

O `CalendarDashboard` já possui:
- Estado `isActivitySheetOpen` e `selectedClientForActivities`
- Função `handleOpenClientClick` que busca dados do cliente no Supabase
- Porém **não renderiza nenhum Sheet/Drawer** no JSX — o estado é setado mas nada aparece

O componente `ClientHistoryDrawer` já existe em `src/pages/clientes-unidade/components/ClientHistoryDrawer.tsx` e exibe o histórico de atividades com timeline visual.

### Alteração

**`src/components/kanban/CalendarDashboard.tsx`**:

1. Importar `ClientHistoryDrawer` de `src/pages/clientes-unidade/components/ClientHistoryDrawer`
2. Renderizar o `ClientHistoryDrawer` no JSX, passando:
   - `open={isActivitySheetOpen}`
   - `onOpenChange={setIsActivitySheetOpen}`
   - `clientId={selectedClientForActivities?.id || null}`
3. Remover o estado `selectedClientForActivities` e simplificar `handleOpenClientClick` para apenas setar o `clientId` string direto, já que o drawer busca os dados internamente

Isso é tudo. O clique no item do calendário já chama `onOpenClient` → `handleOpenClientClick`. Basta renderizar o drawer que já existe.


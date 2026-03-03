

## Plano: Remover botão "Converter para Aluno"

Remover o botão "Converter para Aluno" e a lógica associada do componente `SheetHeaderContent` em `src/components/kanban/components/sheet/SheetHeader.tsx`.

### Mudanças

**Arquivo:** `src/components/kanban/components/sheet/SheetHeader.tsx`
- Remover a função `handleConvertToStudent`
- Remover o import de `useNavigate`
- Remover o bloco do botão "Converter para Aluno" do JSX
- Remover o prop `cardId` se não for mais utilizado em outro lugar do componente


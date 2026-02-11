

## Diferenciar Sidebar por Unidade (Maringá vs Outras)

### Resumo

Adicionar uma flag `maringaOnly` aos itens do menu lateral que devem aparecer apenas quando a unidade ativa for Maringá. Os demais itens continuam visíveis para todas as unidades.

---

### Itens exclusivos de Maringá

| Menu | Grupo atual |
|------|-------------|
| Projeto São Rafael | Menu Principal |
| Galeria de Fotos | Menu Principal |
| Avisos | Menu Principal |
| Painel Administrativo | Administrativo |
| Funcionários | Gestão |
| Controle de Ponto | Gestão |
| Registro de Ponto | Gestão |

---

### Implementação

**Arquivo:** `src/components/AppSidebar.tsx`

1. Importar `useActiveUnit` do contexto.
2. Adicionar a propriedade `maringaOnly: true` nos objetos dos 7 itens listados acima.
3. Criar uma constante com o UUID de Maringá (`0df79a04-444e-46ee-b218-59e4b1835f4a`), que já é utilizado em outros pontos do sistema.
4. Nos filtros de cada grupo (Menu Principal, Administrativo, Gestão), adicionar a verificação: se o item tem `maringaOnly` e a unidade ativa não é Maringá, o item é ocultado.

### Detalhes Técnicos

```typescript
import { useActiveUnit } from '@/contexts/ActiveUnitContext';

const MARINGA_UNIT_ID = '0df79a04-444e-46ee-b218-59e4b1835f4a';

// Nos arrays de itens, adicionar maringaOnly: true nos 7 itens listados
// Exemplo:
{ title: "Projeto São Rafael", url: "/projeto-sao-rafael", icon: Target, maringaOnly: true }

// No componente, obter a unidade ativa:
const { activeUnit } = useActiveUnit();
const isMaringa = activeUnit?.id === MARINGA_UNIT_ID;

// No filtro de itens:
const filteredItems = items.filter(item => {
  if (item.maringaOnly && !isMaringa) return false;
  if (item.requiresTeacher && !isTeacher) return false;
  return true;
});
```

A mesma lógica será aplicada nos arrays `administrativoItems` e `additionalItems`.


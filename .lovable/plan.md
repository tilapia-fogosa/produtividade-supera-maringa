

## Reorganizar Seções da Barra Lateral

### Resumo
Renomear o grupo "Menu Principal" para "Pedagógico" e criar uma nova seção chamada "Comercial" na barra lateral.

### Antes de implementar

Preciso entender quais itens de menu devem ficar na nova seção "Comercial". Algumas perguntas:

1. Quais itens do menu atual devem ser movidos para a seção "Comercial"?
2. Ou a seção "Comercial" começa vazia, aguardando novos itens futuros?
3. Onde a seção "Comercial" deve ficar posicionada? (entre "Pedagógico" e "Administrativo"?)

### Alteração técnica

**Arquivo:** `src/components/AppSidebar.tsx`

- Alterar o `SidebarGroupLabel` de "Menu Principal" para "Pedagógico"
- Criar um novo `SidebarGroup` chamado "Comercial" com os itens definidos pelo usuário
- Posicionar a seção conforme indicado

### Impacto
- Apenas alteração visual na barra lateral
- Nenhuma alteração em banco de dados ou lógica de negócio


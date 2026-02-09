

## Reorganizar Barra Lateral em 3 Grupos

### Objetivo
Transformar os 2 grupos atuais do sidebar em 3 grupos:

1. **Menu Principal** -- permanece como está (visivel para todos)
2. **Gestão** -- o grupo atual "Administração" renomeado, continua visivel apenas para admins, com os itens: Funcionários, Alertas de Falta, Alertas de Evasão, Configurações, Controle de Ponto, Registro de Ponto
3. **Administrativo** -- novo grupo, visivel para perfis `admin` e `administrativo`, com o item: Painel Administrativo

### Alterações Técnicas

**Arquivo:** `src/components/AppSidebar.tsx`

- Renomear o label do grupo "Administração" para "Gestão"
- Remover "Painel Administrativo" do array `additionalItems`
- Criar um novo array `administrativoItems` contendo apenas "Painel Administrativo"
- Renderizar o novo grupo "Administrativo" condicionalmente: visivel quando o perfil for `admin` ou `administrativo`
- Utilizar o hook `useUserPermissions` já existente (propriedade `isAdministrativo`) para a verificação de acesso


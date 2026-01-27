
# Plano: Criar Página "Painel Administrativo" com aba "Pós-Matrícula"

## Objetivo
Criar uma nova página chamada "Painel Administrativo" que inicialmente terá uma aba "Pós-Matrícula" mostrando clientes que realizaram matrículas em 2026.

## Entendimento do Requisito

### Lógica de Dados
- Buscar clientes da tabela `clients` que possuem um registro na tabela `client_activities` com `tipo_atividade = 'Matricula'`
- Filtrar apenas registros onde o `created_at` da atividade de matrícula seja no ano de 2026

### Estrutura das Tabelas Relevantes
**clients:**
- id, name, phone_number, email, status, unit_id, created_at

**client_activities:**
- id, client_id, tipo_atividade, created_at, created_by, unit_id

## Nova Estrutura de Arquivos

```text
src/pages/
  PainelAdministrativo.tsx      (nova página)
src/hooks/
  use-pos-matricula.ts          (novo hook para buscar dados)
```

## Implementação

### 1. Criar Hook `use-pos-matricula.ts`
Query que faz JOIN entre `clients` e `client_activities`:
- Filtra `tipo_atividade = 'Matricula'`
- Filtra `created_at` entre '2026-01-01' e '2026-12-31'
- Agrupa por cliente para evitar duplicatas
- Respeita a unidade ativa do contexto

### 2. Criar Página `PainelAdministrativo.tsx`
Layout:
- Estrutura de abas (Tabs) para permitir futuras expansões
- Aba "Pós-Matrícula" como aba inicial/ativa
- Tabela com lista de clientes matriculados em 2026

Colunas da Tabela:
| Nome | Telefone | Email | Data da Matrícula | Status |

### 3. Adicionar Rota no App.tsx
- Rota: `/painel-administrativo`
- Dentro do layout protegido

### 4. Adicionar no Menu Lateral (AppSidebar)
- Adicionar item "Painel Administrativo" na seção de Administração
- Ícone sugerido: Clipboard ou FileText
- Acesso restrito a admins

## Layout Visual

```text
+----------------------------------------------------+
|  Painel Administrativo                             |
+----------------------------------------------------+
|  [ Pós-Matrícula ]  [ Aba Futura 2 ]  [ ... ]      |
+----------------------------------------------------+
|                                                     |
|  +------------------------------------------------+|
|  | Nome        | Telefone    | Email   | Data     ||
|  |-------------|-------------|---------|----------||
|  | João Silva  | 44999...    | j@...   | 15/01/26 ||
|  | Maria Lima  | 44988...    | m@...   | 22/01/26 ||
|  +------------------------------------------------+|
|                                                     |
+----------------------------------------------------+
```

## Arquivos Modificados/Criados

| Arquivo | Ação |
|---------|------|
| `src/pages/PainelAdministrativo.tsx` | Criar |
| `src/hooks/use-pos-matricula.ts` | Criar |
| `src/App.tsx` | Adicionar rota |
| `src/components/AppSidebar.tsx` | Adicionar menu item |



# Plano de Correções para a Tela de Alunos Ativos

## Resumo dos Problemas Identificados

Após analisar o código, identifiquei as seguintes questões:

### 1. Dados não salvando na gaveta de edição
O componente `ExpandableAlunoCard` cria uma nova instância do hook `useAlunosAtivos()`. Isso significa que quando você salva os dados, a atualização acontece no banco de dados, mas o estado local atualizado é de uma instância diferente da que está na página principal `AlunosAtivos.tsx`. Por isso, ao fechar e reabrir a gaveta, os dados parecem não ter sido salvos (embora estejam no banco).

### 2. Campos faltantes nas seções
**Informações Contratuais** - Adicionar:
- Valor Matrícula (campo `valor_matricula` já existe na tabela)
- Valor Material (campo `valor_material` já existe na tabela)

**Dados do Onboarding** - Adicionar:
- Kit Inicial (campo `kit_sugerido` já existe na tabela - Kit 1 a Kit 8)

### 3. Foto sumindo em telas menores
O layout atual coloca a foto na coluna da direita com `lg:col-span-1`, que só aparece em telas grandes (lg+). Em telas menores, a ordem do grid faz a foto aparecer no final, abaixo de todo o conteúdo, e pode ficar cortada ou fora da área visível.

---

## Implementação Proposta

### Etapa 1: Corrigir o problema de salvamento

**Arquivo**: `src/components/alunos/ExpandableAlunoCard.tsx`

- Remover a criação interna do hook `useAlunosAtivos()`
- Receber as funções de atualização como props do componente pai
- Adicionar callback de `onSave` para notificar a página principal sobre mudanças

**Arquivo**: `src/pages/AlunosAtivos.tsx`

- Passar as funções de atualização do hook para o `ExpandableAlunoCard`
- Garantir que o estado seja atualizado na mesma instância

### Etapa 2: Adicionar novos campos

**Arquivo**: `src/hooks/use-alunos-ativos.ts`

- Adicionar funções de atualização para `valor_matricula`, `valor_material` e `kit_sugerido`
- Atualizar a interface `AlunoAtivo` se necessário (verificar se os campos já estão)

**Arquivo**: `src/components/alunos/ExpandableAlunoCard.tsx`

Na seção **Informações Contratuais**, adicionar:
```text
- Valor Matrícula (campo editável, tipo number, formatação R$)
- Valor Material (campo editável, tipo number, formatação R$)
```

Na seção **Dados do Onboarding**, adicionar:
```text
- Kit Inicial (campo editável com Select: Kit 1, Kit 2, ..., Kit 8)
```

### Etapa 3: Corrigir responsividade da foto

**Arquivo**: `src/components/alunos/ExpandableAlunoCard.tsx`

Reorganizar o layout para que:
- Em telas menores: foto aparece no topo, antes das informações
- Em telas maiores (desktop): foto fica na coluna da direita como está hoje

Alteração no grid:
```
De: grid-cols-1 lg:grid-cols-4
Para: reordenar para que a foto venha primeiro em mobile usando order-first/order-last
```

---

## Detalhes Técnicos

### Interface AlunoAtivo
Os campos já existem, mas precisam ser incluídos no retorno se ainda não estiverem:
- `valor_matricula: number | null`
- `valor_material: number | null` 
- `kit_sugerido: string | null`

### Funções de atualização a criar
```typescript
atualizarValorMatricula(id, valor: number)
atualizarValorMaterial(id, valor: number)
atualizarKitSugerido(id, kit: string)
```

### Opções do Kit Inicial
- Kit 1, Kit 2, Kit 3, Kit 4, Kit 5, Kit 6, Kit 7, Kit 8

---

## Arquivos a Modificar

1. `src/hooks/use-alunos-ativos.ts` - Adicionar novas funções de atualização
2. `src/components/alunos/ExpandableAlunoCard.tsx` - Receber props, adicionar campos e corrigir layout
3. `src/pages/AlunosAtivos.tsx` - Passar funções para o componente


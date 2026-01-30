
# Plano: Ajustes nas Atividades de Abrindo Horizontes

## Resumo

Este plano implementa duas alterações principais:
1. Reorganizar as atividades de Abrindo Horizontes na tela Home em 3 tipos distintos com badges específicas
2. Filtrar alunos ignorados (da tabela `ah_ignorar_coleta`) das atividades da Home

---

## Entendimento Atual

### Situação Atual na Home

A tela Home exibe eventos de AH em apenas 2 categorias:
- `coleta_ah` - Pessoas com mais de 90 dias sem correção (badge vermelha "Coleta")  
- `apostila_ah` - Apostilas já corrigidas prontas para entregar (badge verde "AH")

### Problema Identificado

1. **Falta o grupo "Corrigir AH"**: Apostilas recolhidas mas ainda não corrigidas não aparecem
2. **Pessoas ignoradas aparecem**: Alunos na lista `ah_ignorar_coleta` não devem aparecer nas atividades

---

## Solução Proposta

### 1. Criar 3 Tipos de Atividades AH na Home

| Tipo | Badge | Descrição | Cor |
|------|-------|-----------|-----|
| `coleta_ah` | Coletar | Pessoas com +90 dias sem correção | Vermelho |
| `corrigir_ah` | Corrigir | Apostilas recolhidas sem correção iniciada | Azul |
| `entrega_ah` | Entregar | Apostilas corrigidas prontas para entrega | Verde |

### 2. Filtrar Pessoas Ignoradas

Buscar a lista de pessoas ignoradas (`ah_ignorar_coleta`) e excluí-las das atividades de:
- Coleta AH (hook `use-proximas-coletas-ah.ts` já faz isso, mas a Home não usa esse hook)
- Corrigir AH (nova funcionalidade)
- Entregar AH (nova funcionalidade)

---

## Arquivos a Modificar

### 1. `src/pages/Home.tsx`

**Alterações:**
- Adicionar busca de pessoas ignoradas (`ah_ignorar_coleta`)
- Criar novo tipo de evento `corrigir_ah`
- Renomear `apostila_ah` para `entrega_ah` (consistência)
- Filtrar todas as atividades AH para excluir pessoas ignoradas
- Atualizar ícones e badges para os 3 tipos
- Adicionar handler de clique para `corrigir_ah`

### 2. `src/hooks/use-apostilas-recolhidas.ts`

**Já contém as informações necessárias:**
- `correcao_iniciada: boolean` - Indica se correção foi iniciada
- `total_correcoes: number` - Quantidade de correções feitas
- `foi_entregue: boolean` - Indica se foi entregue

Não precisa modificar, apenas usar os dados existentes.

### 3. `src/hooks/use-professor-atividades.ts`

**Alterações:**
- Buscar lista de pessoas ignoradas
- Adicionar retorno de `apostilasAHParaCorrigir` (recolhidas sem correção)
- Filtrar `coletasAHPendentes` para excluir pessoas ignoradas
- Filtrar `apostilasAHProntas` para excluir pessoas ignoradas

---

## Detalhes Técnicos

### Nova Interface de Evento

```typescript
interface Evento {
  // ... campos existentes
  tipo: 'coleta_ah' | 'corrigir_ah' | 'entrega_ah' | /* outros */;
}
```

### Lógica de Categorização

```text
Para cada apostila recolhida:
├── Se pessoa está na lista de ignorados → IGNORAR
├── Se foi_entregue = true → NÃO MOSTRAR (já concluído)
├── Se total_correcoes > 0 → tipo: 'entrega_ah' (Entregar)
├── Se correcao_iniciada = false → tipo: 'corrigir_ah' (Corrigir)
└── Caso contrário (em correção) → tipo: 'corrigir_ah' (Corrigir)

Para coletas pendentes (+90 dias):
├── Se pessoa está na lista de ignorados → IGNORAR
└── Caso contrário → tipo: 'coleta_ah' (Coletar)
```

### Novas Badges

```typescript
case 'coleta_ah':
  return <Badge className="bg-red-500">Coletar</Badge>;
case 'corrigir_ah':
  return <Badge className="bg-blue-500">Corrigir</Badge>;
case 'entrega_ah':
  return <Badge className="bg-green-500">Entregar</Badge>;
```

### Query para Pessoas Ignoradas

```typescript
const { data: pessoasIgnoradas } = await supabase
  .from('ah_ignorar_coleta')
  .select('pessoa_id')
  .eq('active', true)
  .gte('data_fim', new Date().toISOString());

const idsIgnorados = new Set(pessoasIgnoradas?.map(p => p.pessoa_id) || []);
```

---

## Fluxo de Dados

```text
Home.tsx
    │
    ├── useApostilasRecolhidas() → Lista de apostilas
    │       │
    │       └── Filtra por: !idsIgnorados.has(pessoa_id)
    │               │
    │               ├── total_correcoes > 0 → Evento 'entrega_ah'
    │               └── correcao_iniciada = false → Evento 'corrigir_ah'
    │
    ├── useProfessorAtividades() [para professores]
    │       │
    │       └── coletasAHPendentes, apostilasAHProntas, apostilasParaCorrigir
    │
    └── useProximasColetasAH() [para admins]
            │
            └── Já filtra ignorados internamente
```

---

## Impacto Visual

### Antes
- "Coleta AH: Nome" (badge vermelha "Coleta")
- "AH Pronta: Nome" (badge verde "AH")

### Depois  
- "Coletar AH: Nome" (badge vermelha "Coletar")
- "Corrigir AH: Nome" (badge azul "Corrigir")
- "Entregar AH: Nome" (badge verde "Entregar")

---

## Validações

1. Pessoas na lista `ah_ignorar_coleta` com `active = true` e `data_fim >= hoje` não aparecem em nenhuma atividade AH
2. Os 3 tipos de atividades AH são distinguíveis visualmente
3. Clique em cada tipo abre o modal correto

---

## Próximos Passos Após Aprovação

1. Modificar `src/hooks/use-professor-atividades.ts` para incluir lógica de filtragem
2. Modificar `src/pages/Home.tsx` para implementar os 3 tipos de atividades
3. Testar o comportamento com diferentes perfis (admin, professor)

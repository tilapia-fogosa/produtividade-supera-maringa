
## Plano: Corrigir RPC de Reposições e Otimizar Performance

### Problema Identificado

**Erro principal**: Conflito de function overloading no banco de dados
```
"Could not choose the best candidate function between: 
public.get_lista_completa_reposicoes(), 
public.get_lista_completa_reposicoes(p_incluir_anteriores => boolean)"
```

A migração anterior **criou** uma nova versão da função com parâmetro, mas **não removeu** a versão antiga sem parâmetro.

**Problema secundário**: Performance ruim devido a múltiplas queries N+1 no hook `use-professor-atividades.ts` (uma query por apostila AH).

---

### Solução

#### 1. Remover Função Duplicada (Migração SQL)

Preciso dropar a versão antiga da função que não tem parâmetro:

```sql
-- Remover a versão antiga sem parâmetro
DROP FUNCTION IF EXISTS public.get_lista_completa_reposicoes();
```

Isso deixará apenas a versão nova com o parâmetro `p_incluir_anteriores`.

#### 2. Otimizar Performance do Hook (Opcional)

O problema de performance está neste trecho:

```typescript
// Para CADA apostila recolhida, faz uma query individual
for (const ah of ahRecolhidas || []) {
  const { data: correcoes } = await supabase
    .from('produtividade_ah')
    .select('id')
    .eq('ah_recolhida_id', ah.id)  // Query individual
    .limit(1);
}
```

A otimização seria buscar todas as correções de uma vez:

```typescript
// Buscar TODAS as correções de uma vez só
const ahIds = ahRecolhidas?.map(ah => ah.id) || [];
const { data: todasCorrecoes } = await supabase
  .from('produtividade_ah')
  .select('ah_recolhida_id')
  .in('ah_recolhida_id', ahIds);

// Criar um Set para lookup O(1)
const ahComCorrecao = new Set(todasCorrecoes?.map(c => c.ah_recolhida_id));

// Usar o Set para classificar
for (const ah of ahRecolhidas || []) {
  if (ahComCorrecao.has(ah.id)) {
    // pronta para entregar
  } else if (!ah.correcao_iniciada) {
    // precisa corrigir
  }
}
```

---

### Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| **Migração SQL** | Dropar função `get_lista_completa_reposicoes()` sem parâmetro |
| `src/hooks/use-professor-atividades.ts` | Otimizar queries N+1 para apostilas AH |

---

### Ordem de Execução

1. Executar migração SQL para remover função duplicada
2. Otimizar hook de atividades do professor
3. Testar carregamento da home do professor

---

### Detalhes Técnicos

#### Migração SQL Completa

```sql
-- Remove a função antiga sem parâmetro que está causando conflito
DROP FUNCTION IF EXISTS public.get_lista_completa_reposicoes();
```

#### Hook Otimizado (Trecho Principal)

```typescript
// 5. Buscar apostilas AH prontas e para corrigir - OTIMIZADO
let apostilasAHProntas: ApostilaAHPronta[] = [];
let apostilasAHParaCorrigir: ApostilaAHParaCorrigir[] = [];

if (alunoIds.length > 0) {
  const { data: ahRecolhidas, error: ahError } = await supabase
    .from('ah_recolhidas')
    .select('id, pessoa_id, apostila, data_entrega_real, correcao_iniciada')
    .in('pessoa_id', alunoIds)
    .is('data_entrega_real', null);

  if (ahError) throw ahError;

  // Buscar todas as correções de uma vez (ao invés de N queries)
  const ahIds = ahRecolhidas?.map(ah => ah.id) || [];
  let ahComCorrecao = new Set<number>();
  
  if (ahIds.length > 0) {
    const { data: correcoes, error: correcoesError } = await supabase
      .from('produtividade_ah')
      .select('ah_recolhida_id')
      .in('ah_recolhida_id', ahIds);

    if (correcoesError) throw correcoesError;
    ahComCorrecao = new Set(correcoes?.map(c => c.ah_recolhida_id));
  }

  // Processar sem queries adicionais
  for (const ah of ahRecolhidas || []) {
    if (idsIgnorados.has(ah.pessoa_id)) continue;

    const aluno = alunos?.find(a => a.id === ah.pessoa_id);
    const turma = turmas?.find(t => t.id === aluno?.turma_id);

    if (ahComCorrecao.has(ah.id)) {
      apostilasAHProntas.push({
        id: ah.id,
        pessoa_id: ah.pessoa_id,
        pessoa_nome: aluno?.nome || 'Nome não encontrado',
        apostila: ah.apostila,
        turma_nome: turma?.nome || 'Turma não encontrada',
        dia_semana: turma?.dia_semana || '',
      });
    } else if (!ah.correcao_iniciada) {
      apostilasAHParaCorrigir.push({
        id: ah.id,
        pessoa_id: ah.pessoa_id,
        pessoa_nome: aluno?.nome || 'Nome não encontrado',
        apostila: ah.apostila,
        turma_nome: turma?.nome || 'Turma não encontrada',
        dia_semana: turma?.dia_semana || '',
      });
    }
  }
}
```

Esta otimização reduz de **N queries** (uma por apostila) para **1 query** (busca todas as correções de uma vez).

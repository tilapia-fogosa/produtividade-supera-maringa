
# Plano: Correção do Alerta de Camiseta (60 dias -> 90 dias)

## Problema Identificado

Há uma inconsistência na regra de negócio para exibição do alerta de camiseta pendente:

| Local | Hook | Regra Atual | Regra Correta |
|-------|------|-------------|---------------|
| Página da Turma | `use-lembretes-alunos.ts` | 60+ dias | 90+ dias |
| Painel de Boas-Vindas | `use-professor-atividades.ts` | 90+ dias | 90+ dias |

Isso explica porque a aluna Alice Massago Tanaka aparece na página da turma mas não no painel de boas-vindas - ela provavelmente tem entre 60 e 89 dias.

---

## Solução

### Arquivo a Modificar

`src/hooks/sala/use-lembretes-alunos.ts`

### Alteração

Alterar a linha 126 de:

```typescript
// Camiseta pendente: 60+ dias, não entregue, e não marcado como "não tem tamanho"
const camisetaPendente = diasSupera >= 60 && 
  (!camiseta || (!camiseta.camiseta_entregue && !camiseta.nao_tem_tamanho));
```

Para:

```typescript
// Camiseta pendente: 90+ dias, não entregue, e não marcado como "não tem tamanho"
const camisetaPendente = diasSupera >= 90 && 
  (!camiseta || (!camiseta.camiseta_entregue && !camiseta.nao_tem_tamanho));
```

---

## Impacto

1. O alerta de camiseta na página da turma só aparecerá para alunos com 90+ dias
2. A regra ficará consistente com o painel de boas-vindas
3. A aluna Alice Massago Tanaka não aparecerá mais no alerta até completar 90 dias

---

## Validação

Após a correção, verificar que:
- Alunos com menos de 90 dias não exibem o ícone de camiseta na página da turma
- Alunos com 90+ dias exibem o ícone de camiseta tanto na turma quanto no painel Home



## Aplicar Aceleradores no Calculo de Comissao

### Objetivo

Integrar os aceleradores configurados ao calculo real de comissao, usando o percentual da meta de faturamento atingido para determinar o multiplicador aplicado.

### Logica

1. Calcular o **% da meta de faturamento atingido**: `(totalFaturamento / metaFaturamento) * 100`
2. Encontrar o acelerador correspondente a essa faixa de percentual
3. Multiplicar a comissao base de cada linha pelo multiplicador encontrado
4. Se nenhum acelerador estiver configurado, a comissao permanece sem multiplicador (1x)

### Alteracoes

**Arquivo: `src/pages/Comissao.tsx`**

- Importar `useComissaoMetas` para obter a meta de faturamento do mes selecionado
- Criar funcao `getMultiplicador(percentualMeta, aceleradores)` que percorre os aceleradores ordenados e retorna o multiplicador da faixa correspondente
- Calcular o percentual atingido da meta: `totalFaturamento / metaFaturamento * 100`
- Aplicar o multiplicador no `calcComissao`, multiplicando o resultado da formula pelo acelerador encontrado
- Atualizar o total de comissao para tambem considerar o multiplicador
- Exibir na tabela uma indicacao do multiplicador ativo (ex: "x1.2") ao lado do total ou no header

**Arquivo: `src/hooks/use-comissao-config.ts`**

- Exportar uma funcao utilitaria `findAcelerador(percentual, aceleradores)` que retorna o acelerador correspondente ao percentual informado, para reutilizacao

### Detalhes tecnicos

A funcao `findAcelerador` ordena os aceleradores por `ate_percentual` (crescente) e retorna o primeiro cuja faixa contem o percentual informado. Se o percentual exceder todos os limites, retorna o ultimo acelerador (aquele com `ate_percentual === null`, representando "sem limite").

```text
Exemplo com aceleradores configurados:
  - ate 100%: multiplicador 1.0x
  - ate 130%: multiplicador 1.1x
  - 131%+:    multiplicador 1.2x

Se totalFaturamento = R$80.000 e metaFaturamento = R$100.000
  -> 80% da meta -> multiplicador 1.0x
  -> Comissao final = comissao_base * 1.0

Se totalFaturamento = R$120.000 e metaFaturamento = R$100.000
  -> 120% da meta -> multiplicador 1.1x
  -> Comissao final = comissao_base * 1.1
```

### Comportamento visual

- Na coluna "Comissao" da tabela, o valor exibido ja sera o valor final (com acelerador aplicado)
- No rodape da tabela, o total tambem refletira o multiplicador
- Se houver acelerador ativo diferente de 1x, exibir um badge discreto no header indicando o multiplicador atual (ex: "Acelerador: 1.2x")


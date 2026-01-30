
## Plano: Adicionar Seletor de Data no Cabeçalho da Produtividade

### Contexto do Problema
Atualmente, a página de produtividade da sala sempre usa a data de "hoje" para buscar e registrar produtividade. Porém, se hoje é sexta-feira (30/01) e a turma tem aula na quinta-feira, a última aula foi ontem (29/01). O professor precisa poder selecionar a data correta para lançar a produtividade.

### Solução Proposta
Adicionar um **seletor de data** no cabeçalho que:
1. Calcula automaticamente a **última aula da turma** baseado no dia da semana
2. Permite ao professor **alterar a data** se necessário (ex: lançar aula de semanas anteriores)
3. Atualiza todos os dados (pessoas e produtividade registrada) com base na data selecionada

### Lógica de Cálculo da Última Aula

```
Exemplo: Hoje é Sexta-feira 30/01/2026
Turma: Quinta-feira

1. Dia da turma = Quinta (índice 4)
2. Hoje = Sexta (índice 5)
3. Diferença = 5 - 4 = 1 dia
4. Última aula = 30/01 - 1 = 29/01/2026
```

Se a diferença for 0 (hoje É o dia da turma), usa hoje.
Se a diferença for negativa, ajusta para a semana anterior.

---

### Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/pages/sala/SalaProdutividadeTurma.tsx` | Adicionar estado de data selecionada e lógica de cálculo |
| `src/components/sala/SalaProdutividadeScreen.tsx` | Adicionar DatePicker no cabeçalho |
| `src/hooks/sala/use-sala-pessoas-turma.ts` | Aceitar data como parâmetro na busca |
| `src/hooks/sala/use-reposicoes-hoje.ts` | Aceitar data como parâmetro (renomear para `use-reposicoes-data`) |
| `src/components/sala/SalaProdutividadeDrawer.tsx` | Receber data selecionada como prop |

---

### Detalhes Técnicos

#### 1. Função para Calcular Última Aula

```typescript
// Mapear dia da semana para índice (0 = Domingo, 1 = Segunda, etc.)
const diasSemanaMap: Record<string, number> = {
  'Domingo': 0,
  'Segunda-feira': 1,
  'Terça-feira': 2,
  'Quarta-feira': 3,
  'Quinta-feira': 4,
  'Sexta-feira': 5,
  'Sábado': 6,
};

function calcularUltimaAula(diaSemana: string): Date {
  const hoje = new Date();
  const diaHoje = hoje.getDay(); // 0-6
  const diaTurma = diasSemanaMap[diaSemana];
  
  let diferenca = diaHoje - diaTurma;
  if (diferenca < 0) {
    diferenca += 7; // Ajusta para semana anterior
  }
  
  const ultimaAula = new Date(hoje);
  ultimaAula.setDate(hoje.getDate() - diferenca);
  return ultimaAula;
}
```

#### 2. Alterações no Cabeçalho (SalaProdutividadeScreen)

O cabeçalho atual:
```
[←] Turma Nome
    Quinta-feira • Sala 3
```

Novo layout:
```
[←] Turma Nome                    [📅 29/01/2026 ▼]
    Quinta-feira • Sala 3
```

- DatePicker usando Popover + Calendar (padrão Shadcn)
- Mostra a data formatada "dd/MM/yyyy"
- Alinhado à direita do cabeçalho

#### 3. Fluxo de Dados com Data Selecionada

```
SalaProdutividadeTurma (página)
├── dataSelecionada (state) ← calculada ao carregar turma
├── setDataSelecionada ← callback para o DatePicker
│
├── useSalaPessoasTurma(turmaId, dataSelecionada)
│   └── Busca produtividade para a data selecionada
│
├── useReposicoesHoje(turmaId, dataSelecionada) 
│   └── Busca reposições para a data selecionada
│
└── SalaProdutividadeDrawer
    └── dataAula ← inicializa com dataSelecionada
```

---

### Fluxo de Implementação

1. **Criar função utilitária** `calcularUltimaAula(diaSemana: string): Date`

2. **Atualizar SalaProdutividadeTurma.tsx**
   - Adicionar estado `dataSelecionada`
   - Calcular data inicial quando turma for carregada
   - Passar data para hooks e componentes
   - Atualizar lógica de exclusão para usar data selecionada

3. **Atualizar SalaProdutividadeScreen.tsx**
   - Receber props `dataSelecionada` e `onDataChange`
   - Adicionar DatePicker no cabeçalho (Popover + Calendar)

4. **Atualizar use-sala-pessoas-turma.ts**
   - Modificar `buscarPessoasPorTurma(turmaId, data)` para aceitar data
   - Usar a data recebida ao invés de `new Date()`

5. **Atualizar use-reposicoes-hoje.ts**
   - Adicionar parâmetro `data` no hook
   - Usar a data recebida na query

6. **Atualizar SalaProdutividadeDrawer.tsx**
   - Receber `dataInicial` como prop
   - Inicializar `dataAula` com a prop recebida

---

### Considerações

1. **Performance**: O DatePicker não deve causar re-fetches desnecessários (usar useCallback/useMemo)
2. **Validação**: Não permitir selecionar datas futuras
3. **UX**: Mostrar indicador visual quando a data não é "hoje" (ex: badge "Data retroativa")
4. **Consistência**: Ao mudar a data, os cards devem refletir a produtividade daquele dia

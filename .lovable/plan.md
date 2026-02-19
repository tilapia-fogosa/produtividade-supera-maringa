
# Correção: Exibir todos os alunos no Diário de Turma (incluindo ausentes)

## Problema
Atualmente, o Diário de Turma só exibe alunos que possuem um registro na tabela `produtividade_abaco` para aquela data. Alunos que faltaram e não tiveram nenhum registro criado simplesmente não aparecem na lista.

## Solução
Alterar a lógica em `DiarioTurmaAccordion.tsx` para:
1. Buscar todos os alunos/funcionarios ativos da turma (como ja faz)
2. Buscar os registros de produtividade existentes (como ja faz)
3. **Combinar as duas listas**: para cada pessoa da turma, se existir registro de produtividade, usar os dados dele; se nao existir, criar uma entrada "virtual" com status Ausente

## Detalhes Tecnicos

### Arquivo: `src/components/diario/DiarioTurmaAccordion.tsx`

Na funcao `buscarDadosTurma`, apos buscar os registros de produtividade (linha ~103-108), alterar a logica de montagem dos registros:

**Logica atual** (linhas 112-120): Itera apenas sobre `produtividadeData`, ou seja, so mostra quem tem registro.

**Nova logica**: Iterar sobre `pessoasTurma` (todos os alunos/funcionarios). Para cada pessoa, verificar se existe um registro em `produtividadeData`. Se existir, usar os dados do registro. Se nao existir, criar um registro virtual com `presente: false` e campos vazios.

```text
Para cada pessoa em pessoasTurma:
  - Se tem registro em produtividadeData -> usar dados reais
  - Se NAO tem registro -> criar entrada com:
      id: "virtual-{pessoa.id}"
      pessoa_id: pessoa.id
      presente: false
      apostila/pagina/exercicios/erros/comentario: null
      pessoa: { nome, foto_url, origem }
      origem: pessoa.origem
```

O `totalRegistros` tambem sera atualizado para refletir o total de pessoas (nao apenas os registros existentes).

### Arquivo: `src/components/turmas/turma-detail/diario/DiarioTabela.tsx`

Pequeno ajuste para nao mostrar botoes de Editar/Excluir em registros "virtuais" (que comecam com "virtual-"), ja que esses registros nao existem no banco.

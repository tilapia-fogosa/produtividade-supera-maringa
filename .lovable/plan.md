

# Otimizacao de Performance - Painel Administrativo

## Problemas Identificados

1. **Aba Atividades Pos-Venda**: O hook `use-atividades-pos-venda.ts` nao filtra por unidade ativa, trazendo registros de todas as unidades. Faz 2 queries sequenciais (atividade_pos_venda + alunos).

2. **Aba Fichas de Rescisao**: O hook `use-fichas-rescisao.ts` busca TODAS as fichas do banco e filtra por unidade no frontend (JavaScript), desperdicando banda e processamento. Filtros de nome e data tambem sao aplicados no frontend em vez de no banco.

3. **Aba Pos-Matricula** (oculta, mas carrega no hook da pagina pai): Faz 4 queries sequenciais ao banco (client_activities, atividade_pos_venda, alunos, profiles).

4. **Requests N+1 vistos nas network logs**: Dezenas de chamadas individuais para `alunos`, `professores` e `turmas` - o mesmo professor sendo buscado repetidamente para cada registro.

## Plano de Otimizacao

### 1. Hook `use-atividades-pos-venda.ts`
- Adicionar filtro por `unit_id` da unidade ativa usando o contexto `useActiveUnit`
- A tabela `atividade_pos_venda` ja possui coluna `unit_id`, basta adicionar `.eq("unit_id", activeUnit.id)` na query
- Desabilitar a query quando `activeUnit` nao estiver disponivel (`enabled: !!activeUnit?.id`)

### 2. Hook `use-fichas-rescisao.ts`
- Mover filtro de unidade para o banco: adicionar `.eq("alerta_evasao.alunos.unit_id", activeUnit.id)` na query Supabase
- Mover filtro de data para o banco com `.gte` e `.lte` em `created_at`
- Mover filtro de nome para o banco com `.ilike("alerta_evasao.alunos.nome", "%nome%")`
- Isso reduz drasticamente o volume de dados transferidos

### 3. Remover queries desnecessarias da pagina pai
- O `PainelAdministrativo.tsx` instancia `usePosMatricula()` no nivel da pagina, mas a aba Pos-Matricula esta oculta. Remover essa chamada para evitar queries ao banco que nao sao utilizadas.

### 4. Eliminar requests N+1 nas Fichas de Rescisao
- A query de fichas de rescisao ja usa JOINs aninhados (`alunos -> turmas -> professores`), entao os dados ja vem na resposta. Se houver componentes filhos fazendo buscas individuais, corrigir para usar os dados ja carregados.

## Secao Tecnica

### Arquivos modificados:
- `src/hooks/use-atividades-pos-venda.ts` - Adicionar filtro por unidade ativa
- `src/hooks/use-fichas-rescisao.ts` - Mover filtros para o banco de dados
- `src/pages/PainelAdministrativo.tsx` - Remover hook e imports nao utilizados da aba oculta

### Resultado esperado:
- Reducao significativa no numero de registros buscados (apenas da unidade ativa)
- Eliminacao de filtragem no frontend que deveria ocorrer no banco
- Remocao de queries desnecessarias da aba oculta
- Carregamento mais rapido da tela


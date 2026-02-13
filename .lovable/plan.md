

## Ocultar Aulas Inaugurais concluidas da Home

### Objetivo
Quando todos os 5 campos da Aula Zero estiverem preenchidos na tabela `alunos`, a atividade de Aula Inaugural correspondente nao deve mais aparecer na tela Home.

### Onde os dados sao salvos
Os dados sao salvos na tabela `alunos`, nos campos:
- `percepcao_coordenador`
- `motivo_procura`
- `avaliacao_abaco`
- `avaliacao_ah`
- `pontos_atencao`

### Salvamento parcial
Sim, sera possivel salvar com apenas alguns campos preenchidos. A atividade so desaparecera da Home quando **todos os 5 campos** estiverem preenchidos.

### Alteracao necessaria

**Arquivo:** `src/hooks/use-aulas-inaugurais-professor.ts`

Apos buscar as aulas inaugurais e os nomes dos clientes, adicionar uma etapa extra:

1. Coletar todos os `client_id` dos eventos retornados
2. Buscar na tabela `alunos` os registros vinculados a esses `client_id`, selecionando os 5 campos da Aula Zero
3. Identificar quais `client_id` tem **todos os 5 campos preenchidos** (nao nulos e nao vazios)
4. Filtrar o resultado final, removendo as aulas inaugurais cujo `client_id` tenha todos os campos completos

### Logica de verificacao

```text
Para cada aluno vinculado ao client_id:
  SE percepcao_coordenador E motivo_procura E avaliacao_abaco E avaliacao_ah E pontos_atencao
     estao todos preenchidos (nao nulos e nao string vazia)
  ENTAO -> remover da lista de aulas inaugurais
```

### Impacto
- Nenhuma alteracao no banco de dados
- Nenhuma alteracao no componente AulaZeroDrawer
- Apenas o hook `use-aulas-inaugurais-professor.ts` sera modificado para filtrar as atividades concluidas
- Funciona tanto para Admin quanto para Professor


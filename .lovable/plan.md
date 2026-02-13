
## Gaveta de Aula Zero ao clicar na Aula Inaugural (Home)

### Objetivo
Ao clicar em uma atividade do tipo "Aula Inaugural" na tela Home, abrir uma gaveta lateral (Sheet 480px) com o formulario de Aula Zero. O nome do aluno ja estara preenchido automaticamente com base no `client_id` do evento.

### Mudancas necessarias

#### 1. Novo componente: `src/components/aula-zero/AulaZeroDrawer.tsx`
- Gaveta lateral (Sheet) com largura de 480px, seguindo o padrao do projeto
- Contem os mesmos campos do formulario da pagina `/aula-zero`:
  - Percepcao do Coordenador (textarea)
  - Motivo da Procura (textarea)
  - Avaliacao no Abaco (textarea)
  - Avaliacao no Abrindo Horizontes (textarea)
  - Pontos de Atencao (textarea)
- O campo "Aluno" nao sera um seletor -- sera exibido como texto fixo (nome do aluno ja preenchido)
- Botao "Salvar" que:
  - Atualiza os campos na tabela `alunos` (mesmo comportamento da pagina AulaZero)
  - Envia para o webhook (mesmo comportamento)
  - Fecha a gaveta ao concluir

#### 2. Alteracao no hook: `src/hooks/use-aulas-inaugurais-professor.ts`
- Adicionar `client_id` na interface `AulaInaugural`
- Retornar o `client_id` nos dados mapeados (ja esta sendo buscado, so nao esta sendo retornado)

#### 3. Alteracao na interface Evento: `src/pages/Home.tsx`
- Adicionar campo opcional `client_id` na interface `Evento`
- Ao montar eventos de `aula_inaugural`, incluir o `client_id` do evento
- Adicionar estado para controlar abertura da gaveta (`aulaZeroDrawerAberto`)
- Adicionar estado para dados do aluno selecionado (`aulaZeroAluno`)
- No `renderEvento`, tornar `aula_inaugural` clicavel
- No `handleClick`, ao clicar em `aula_inaugural`:
  - Buscar o `aluno` na tabela `alunos` pelo `client_id` do evento
  - Abrir a gaveta com o nome do aluno preenchido
- Renderizar o componente `AulaZeroDrawer` no JSX da Home

### Detalhes tecnicos

**Fluxo de dados:**
```text
Evento (aula_inaugural) -> client_id -> busca alunos.client_id -> aluno_id + aluno_nome -> AulaZeroDrawer
```

**AulaZeroDrawer props:**
- `open: boolean`
- `onOpenChange: (open: boolean) => void`
- `alunoId: string`
- `alunoNome: string`
- `onSalvo?: () => void` (callback apos salvar)

**Salvamento:** Reutiliza a mesma logica da pagina AulaZero -- update na tabela `alunos` e envio ao webhook buscando a URL de `dados_importantes`.

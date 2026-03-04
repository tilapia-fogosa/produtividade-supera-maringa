

## Plano: Remover página CadastroNovoAluno

A página `/cadastro-novo-aluno` é órfã (sem nenhum link apontando para ela) e será removida junto com sua rota.

### Alterações

1. **Remover arquivo** `src/pages/CadastroNovoAluno.tsx`
2. **Remover do `App.tsx`**: remover o import e a `<Route>` de `/cadastro-novo-aluno`

Isso elimina também a última referência de `client_id` no contexto de criação de alunos, simplificando a desvinculação futura da coluna.


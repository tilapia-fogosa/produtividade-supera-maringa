

## Problema Identificado

O componente `cmdk` (Command) normaliza o valor passado ao `onSelect` para lowercase. Como os UUIDs dos alunos contêm letras maiúsculas e minúsculas, o valor recebido no callback fica diferente do ID real do aluno, impedindo a vinculação.

Na linha 735-736 do `DadosFinaisForm.tsx`:
```typescript
onSelect={(value) => {
  setSelectedAlunoId(value === selectedAlunoId ? null : value);
```
O `value` aqui chega em lowercase, então o `selectedAlunoId` fica com um UUID inválido.

## Solução

Alterar o `onSelect` para usar diretamente o `aluno.id` da iteração do `.map()` em vez de confiar no `value` do callback:

```typescript
onSelect={() => {
  setSelectedAlunoId(aluno.id === selectedAlunoId ? null : aluno.id);
  setOpenAlunoPopover(false);
  setSearchFilter("");
}}
```

### Arquivo afetado
- `src/components/painel-administrativo/DadosFinaisForm.tsx` (linha 735-738)

Alteração mínima de 1 linha, sem impacto em outras funcionalidades.


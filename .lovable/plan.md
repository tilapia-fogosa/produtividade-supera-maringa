

## Adicionar opcao "Adicionar Comentario" no modal de alerta duplicado

### Resumo
Quando o usuario tenta criar um alerta de evasao e ja existe um pendente, o modal de confirmacao ganhara um terceiro botao: "Adicionar Comentario". Ao clicar, o modal expande verticalmente revelando um campo de texto e um botao de enviar. O comentario sera salvo como uma atividade do tipo `comentario` com status `concluida`, vinculada ao primeiro alerta pendente.

### Alteracoes

**1. Adicionar novo tipo de atividade `comentario`**

Arquivo: `src/hooks/use-atividades-alerta-evasao.ts`
- Adicionar `'comentario'` ao type `TipoAtividadeEvasao`
- Adicionar entrada no array `TIPOS_ATIVIDADE` com label "Comentario" e uma cor (ex: `bg-gray-500`)

**2. Atualizar o tipo no Supabase**

- Criar migration para adicionar `'comentario'` ao enum `tipo_atividade_evasao` no banco de dados (se existir enum, senao apenas inserir diretamente)

**3. Modificar o modal de confirmacao de duplicidade**

Arquivo: `src/components/alerta-evasao/AlertaEvasaoModal.tsx`
- Adicionar estados: `showComentarioForm` (boolean) e `comentarioTexto` (string)
- Adicionar terceiro botao "Adicionar Comentario" no footer do AlertDialog
- Quando clicado, expandir o modal mostrando:
  - Um `Textarea` para digitar o comentario
  - Um botao "Enviar" que insere a atividade na tabela `atividades_alerta_evasao`
- Ao enviar:
  - Inserir registro na tabela `atividades_alerta_evasao` com:
    - `alerta_evasao_id`: ID do primeiro alerta pendente (`alertasPendentes[0].id`)
    - `tipo_atividade`: `'comentario'`
    - `descricao`: texto digitado pelo usuario
    - `status`: `'concluida'`
    - `responsavel_nome`: nome do funcionario logado
    - `concluido_por_nome`: nome do funcionario logado
  - Fechar o modal e resetar o formulario

### Secao Tecnica

```text
Modal atual:
+----------------------------------+
| Alerta ja existente              |
| [lista de alertas pendentes]     |
|                                  |
| [Cancelar] [Criar mesmo assim]  |
+----------------------------------+

Modal apos clicar "Adicionar Comentario":
+----------------------------------+
| Alerta ja existente              |
| [lista de alertas pendentes]     |
|                                  |
| +------------------------------+|
| | Textarea (comentario)        ||
| |                              ||
| +------------------------------+|
| [Enviar]                         |
|                                  |
| [Cancelar] [Adicionar Coment.]  |
|            [Criar mesmo assim]  |
+----------------------------------+
```

Arquivos modificados:
- `src/hooks/use-atividades-alerta-evasao.ts` (adicionar tipo)
- `src/components/alerta-evasao/AlertaEvasaoModal.tsx` (UI e logica de insercao)
- Migration SQL (adicionar valor ao enum)


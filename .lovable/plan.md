

## Melhoria do Layout da Gaveta de Aula Zero

### Problemas identificados

1. **Conflito de largura**: O `SheetContent` define `w-[480px]` mas o componente base `sheet.tsx` aplica `sm:max-w-sm` (384px) no variant `right`, cortando o conteudo
2. **Falta de padding interno**: O `SheetContent` nao tem `p-6` explicito, causando margens cortadas
3. **Espacamento excessivo**: `space-y-4` e `min-h-[80px]` nos textareas ocupam muito espaco vertical
4. **Nao segue o padrao desktop denso** do projeto (tipografia menor, espacamento compacto)

### Alteracoes no arquivo `src/components/aula-zero/AulaZeroDrawer.tsx`

1. **Corrigir largura**: Usar `sm:max-w-[480px]` para sobrescrever o `sm:max-w-sm` do variant base, e adicionar `p-6` para padding interno
2. **Compactar layout seguindo padrao desktop**:
   - Labels com `text-xs font-medium`
   - Textareas com `min-h-[60px]` (ao inves de 80px)
   - Espacamento do form: `space-y-3` (ao inves de 4)
   - Header com `mb-3` (ao inves de 4)
   - Titulo com `text-sm font-semibold`
   - Botao salvar compacto: `h-8 text-xs`
3. **Estrutura de scroll correta**: Envolver apenas o form em `overflow-y-auto` com `flex-1`, mantendo header e footer fixos

### Resultado esperado
Uma gaveta com 480px de largura real, margens internas corretas, conteudo sem cortes, e visual alinhado ao padrao desktop denso do projeto.

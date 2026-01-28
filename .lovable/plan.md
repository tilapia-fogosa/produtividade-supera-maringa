

# Plano: Corrigir Erro ao Salvar Dados Iniciais

## Problema Identificado
O erro ao salvar os "Dados Iniciais" é causado pelo uso de `Buffer.from()` no código do cliente. Esta é uma API exclusiva do Node.js que não existe no navegador, causando um erro de JavaScript quando o usuário tenta salvar com uma foto capturada.

## Causa Raiz
No arquivo `DadosFinaisForm.tsx`, linha 140, o código utiliza:
```typescript
Buffer.from(base64Data, 'base64')
```

Esta função não está disponível no ambiente do navegador e causa um `ReferenceError: Buffer is not defined`.

## Solução
Substituir `Buffer.from()` por uma função compatível com navegador que converte base64 para Blob usando APIs nativas do browser.

## Alterações Necessárias

### Arquivo: `src/components/painel-administrativo/DadosFinaisForm.tsx`

**Mudança 1:** Adicionar função auxiliar para converter base64 para Blob
```typescript
// Função para converter base64 em Blob (compatível com navegador)
function base64ToBlob(base64: string, contentType: string): Blob {
  const byteCharacters = atob(base64);
  const byteArrays = [];
  
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  
  return new Blob(byteArrays, { type: contentType });
}
```

**Mudança 2:** Substituir o uso de `Buffer.from()` pela nova função
```typescript
// De:
const { error: uploadError } = await supabase.storage
  .from('alunos-fotos')
  .upload(fileName, Buffer.from(base64Data, 'base64'), {
    contentType: 'image/jpeg',
    upsert: true
  });

// Para:
const blob = base64ToBlob(base64Data, 'image/jpeg');
const { error: uploadError } = await supabase.storage
  .from('alunos-fotos')
  .upload(fileName, blob, {
    contentType: 'image/jpeg',
    upsert: true
  });
```

## Resumo das Alterações

| Arquivo | Tipo de Alteração |
|---------|-------------------|
| `src/components/painel-administrativo/DadosFinaisForm.tsx` | Adicionar função `base64ToBlob` e substituir `Buffer.from()` |

## Resultado Esperado
Após a correção, o usuário poderá:
- Capturar foto com a webcam
- Marcar todos os checkboxes
- Vincular um aluno
- Salvar os dados sem erro


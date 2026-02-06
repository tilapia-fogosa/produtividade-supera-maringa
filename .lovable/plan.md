
# Plano: Corrigir Parse de Datas do Excel no Upload de Aniversariantes

## Problema Identificado

O arquivo XLS contém duas colunas:
- **DATANASC**: apenas o dia (número simples)
- **DATA_NASC**: data completa no formato "3/2/66"

Quando o `xlsx` library faz o parse do arquivo, o Excel converte automaticamente datas em **números seriais**. Por exemplo, "3/2/66" é convertido para `24168`.

Atualmente, o código na linha 107 faz:
```typescript
const dataNascStr = row['DATA_NASC']?.toString().trim();
```

E depois passa para `parseDate(dataNascStr)`, mas como está convertendo para string primeiro, o número serial `24168` vira a string `"24168"`, e a função `parseDate` tenta fazer split por `/`, o que falha porque não há barras nessa string.

## Solução

**Modificar a linha 107 e 114** para **NÃO converter para string antes** de passar para `parseDate`:

```typescript
// Linha 107 - MUDAR DE:
const dataNascStr = row['DATA_NASC']?.toString().trim();

// PARA:
const dataNasc = row['DATA_NASC'];
```

E então na linha 114:
```typescript
// MUDAR DE:
const dataNascimento = parseDate(dataNascStr);

// PARA:
const dataNascimento = parseDate(dataNasc);
```

Dessa forma, se o Excel retornar um número (serial date), a função `parseDate` receberá o número diretamente e poderá usar a lógica de conversão que já existe nas linhas 32-43.

Se o Excel retornar uma string (menos provável, mas possível dependendo da formatação da célula), a função também tratará corretamente com a lógica das linhas 46-81.

## Validação Adicional

Também vou ajustar a validação na linha 109 para verificar se o valor existe (não apenas se a string está vazia):

```typescript
// MUDAR DE:
if (!nome || !dataNascStr) {
  resultados.erros.push(`Linha inválida: NOME ou DATA_NASC vazio`);
  continue;
}

// PARA:
if (!nome || dataNasc === undefined || dataNasc === null) {
  resultados.erros.push(`Linha inválida: NOME ou DATA_NASC vazio`);
  continue;
}
```

## Arquivos Afetados

- `src/components/sync/AniversariantesUploadComponent.tsx` (linhas 106-118)

## Detalhes Técnicos

A função `parseDate` já está preparada para receber tanto números (serial do Excel) quanto strings. O problema estava apenas na conversão prematura para string antes de passar o valor para a função.

Com essa mudança:
- **24168** (número) → será detectado como `typeof dateValue === 'number'` → convertido corretamente para `1966-03-02`
- **"3/2/66"** (string) → será tratado pelo bloco de parsing de string → também convertido para `1966-03-02`

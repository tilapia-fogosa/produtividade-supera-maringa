

# Fase 6: Sincronizar Turmas - Suporte Multi-Unidade

## Objetivo
Remover o `MARINGA_UNIT_ID` hardcoded da sincronizacao de turmas e passar a usar a unidade ativa do usuario, garantindo que cada unidade sincronize apenas seus proprios dados.

---

## Mudancas Necessarias

### 1. Frontend - `XlsUploadComponent.tsx`
- Importar `useActiveUnit` do contexto
- Enviar o `unit_id` da unidade ativa no body da chamada da edge function `sync-turmas-xls`
- Se nenhuma unidade estiver ativa, bloquear o upload

### 2. Edge Function - `sync-turmas-xls/index.ts`
- Remover a constante `MARINGA_UNIT_ID` hardcoded (linha 42)
- Receber o `unitId` do body da requisicao (`req.json()`)
- Validar que o `unitId` foi enviado (retornar erro 400 se ausente)
- Substituir todas as ~20 ocorrencias de `MARINGA_UNIT_ID` por `unitId` recebido

### 3. Hook - `use-ultima-sincronizacao.ts`
- Importar `useActiveUnit`
- Filtrar o historico de sincronizacoes pela unidade ativa usando `.eq('unit_id', activeUnit?.id)`
- Incluir `activeUnit?.id` na queryKey

### 4. Pagina - `SincronizarTurmas.tsx`
- Nenhuma alteracao necessaria (ja consome o hook que sera atualizado)

---

## Detalhes Tecnicos

### Alteracoes no `XlsUploadComponent.tsx`
```typescript
// Adicionar import
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

// Dentro do componente
const { activeUnit } = useActiveUnit();

// Na chamada da edge function (linha 206-211)
const { data, error } = await supabase.functions.invoke('sync-turmas-xls', {
  body: {
    xlsData: previewData,
    fileName: selectedFile?.name || 'arquivo.xlsx',
    unitId: activeUnit?.id  // NOVO
  }
});

// Desabilitar botao se nao houver unidade ativa
disabled={isUploading || !previewData || !activeUnit?.id}
```

### Alteracoes na Edge Function `sync-turmas-xls/index.ts`
```typescript
// Linha 39: extrair unitId do body
const { xlsData, fileName, unitId }: { xlsData: XlsData; fileName: string; unitId: string } = await req.json();

// Remover linha 42 (MARINGA_UNIT_ID hardcoded)

// Validacao
if (!unitId) {
  return new Response(
    JSON.stringify({ error: 'unitId é obrigatório' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
  );
}

// Substituir TODAS as ocorrencias de MARINGA_UNIT_ID por unitId
// (aprox. 20 ocorrencias nas linhas 57, 107, 117, 127, 163, 164, 188, 229, 271, 314, 353, 398, 424, 473, 521, 534)
```

### Alteracoes no `use-ultima-sincronizacao.ts`
```typescript
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

export const useUltimaSincronizacao = () => {
  const { activeUnit } = useActiveUnit();
  
  return useQuery({
    queryKey: ["ultimas-sincronizacoes", activeUnit?.id],
    queryFn: async () => {
      let query = supabase
        .from('data_imports')
        .select('*')
        .eq('import_type', 'turmas-xls')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (activeUnit?.id) {
        query = query.eq('unit_id', activeUnit.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });
};
```

---

## Resumo de Impacto

| Arquivo | Tipo de Alteracao |
|---|---|
| `src/components/sync/XlsUploadComponent.tsx` | Enviar `unitId` para edge function |
| `supabase/functions/sync-turmas-xls/index.ts` | Receber `unitId` dinamico, remover hardcode |
| `src/hooks/use-ultima-sincronizacao.ts` | Filtrar historico por unidade |

Nenhuma migracao de banco necessaria - a tabela `data_imports` ja possui coluna `unit_id`.


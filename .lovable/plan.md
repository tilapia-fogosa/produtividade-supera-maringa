

## Adicionar Fase 6: Tela Sincronizar Turmas ao Documento de Migracao

### Objetivo
Documentar no arquivo `MIGRACAO_MULTI_UNIDADES.md` a analise completa da tela de Sincronizar Turmas e as tarefas necessarias para suportar multi-unidades.

### Conteudo a ser Adicionado

**Nova Secao: Fase 6 - Tela Sincronizar Turmas**

---

#### 6.1 Visao Geral da Arquitetura

A tela de Sincronizar Turmas e responsavel por importar dados de turmas, professores e alunos via arquivo Excel. Atualmente usa unit_id fixo de Maringa.

**Arquivos principais:**
- `src/pages/SincronizarTurmas.tsx` - Pagina principal
- `src/components/sync/XlsUploadComponent.tsx` - Componente de upload
- `src/hooks/use-ultima-sincronizacao.ts` - Hook de historico
- `supabase/functions/sync-turmas-xls/index.ts` - Edge Function

---

#### 6.2 Problema Atual

| Componente | Problema | Impacto |
|------------|----------|---------|
| Edge Function | Unit ID fixo (`0df79a04-444e-46ee-b218-59e4b1835f4a`) | Todos os dados sincronizam para Maringa |
| XlsUploadComponent | Nao envia unit_id para backend | Impossibilita sincronizar para outras unidades |
| use-ultima-sincronizacao | Nao filtra por unidade | Historico mostra sincronizacoes de todas unidades |

---

#### 6.3 Solucao Proposta

**Regra de Negocio:**
- Usuario com 1 unidade: sincroniza automaticamente para ela
- Usuario com multiplas unidades: escolhe para qual unidade sincronizar

---

#### 6.4 Alteracoes no Frontend

**Arquivo: `src/components/sync/XlsUploadComponent.tsx`**
- Importar `useActiveUnit` do contexto
- Exibir nome da unidade ativa no cabecalho do card
- Passar `unitId` no body da chamada da Edge Function
- Atualizar texto do botao para incluir nome da unidade

**Arquivo: `src/pages/SincronizarTurmas.tsx`**
- Exibir unidade ativa no cabecalho da pagina
- Passar `unitId` para o hook de historico

**Arquivo: `src/hooks/use-ultima-sincronizacao.ts`**
- Adicionar parametro `unitId`
- Filtrar por `unit_id` na query
- Atualizar `queryKey` para incluir unitId

---

#### 6.5 Alteracoes na Edge Function

**Arquivo: `supabase/functions/sync-turmas-xls/index.ts`**

Codigo atual:
```typescript
const MARINGA_UNIT_ID = '0df79a04-444e-46ee-b218-59e4b1835f4a';
```

Codigo novo:
```typescript
const { xlsData, fileName, unitId }: { 
  xlsData: XlsData; 
  fileName: string; 
  unitId: string;
} = await req.json();

if (!unitId) {
  return new Response(
    JSON.stringify({ error: 'unitId e obrigatorio' }),
    { headers: corsHeaders, status: 400 }
  );
}
```

---

#### 6.6 Banco de Dados

A tabela `data_imports` ja possui a coluna `unit_id` (NOT NULL), portanto nao e necessaria migracao de banco de dados para esta funcionalidade.

---

#### 6.7 Checklist de Tarefas - Tela Sincronizar Turmas

**Frontend**
- [ ] Atualizar `XlsUploadComponent.tsx`:
  - [ ] Importar `useActiveUnit`
  - [ ] Exibir unidade ativa no cabecalho
  - [ ] Passar `unitId` no body do `supabase.functions.invoke`
  - [ ] Atualizar botao com nome da unidade

- [ ] Atualizar `SincronizarTurmas.tsx`:
  - [ ] Exibir unidade ativa no cabecalho
  - [ ] Passar `unitId` para hook de historico

- [ ] Atualizar `use-ultima-sincronizacao.ts`:
  - [ ] Adicionar parametro `unitId`
  - [ ] Filtrar por `unit_id`
  - [ ] Atualizar `queryKey`

**Backend (Edge Function)**
- [ ] Atualizar `sync-turmas-xls/index.ts`:
  - [ ] Remover constante `MARINGA_UNIT_ID`
  - [ ] Receber `unitId` do body
  - [ ] Validar presenca do `unitId`
  - [ ] Substituir todas ocorrencias por `unitId` dinamico

**Testes**
- [ ] Testar sincronizacao com usuario de 1 unidade
- [ ] Testar sincronizacao com usuario de multiplas unidades
- [ ] Verificar que historico filtra por unidade correta
- [ ] Verificar que dados sao salvos com unit_id correto

---

### Arquivo a ser Modificado

- `MIGRACAO_MULTI_UNIDADES.md` - Adicionar Fase 6 apos a Fase 5, atualizar historico e proximos passos


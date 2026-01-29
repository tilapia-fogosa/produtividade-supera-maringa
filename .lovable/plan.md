

## Plano: Adicionar Fase 8 (Abrindo Horizontes) ao MD de Migração

### Objetivo
Adicionar a documentação completa da Fase 8 (Tela Abrindo Horizontes) ao arquivo `MIGRACAO_MULTI_UNIDADES.md`.

---

### Estrutura da Adição

A Fase 8 será adicionada após a linha 1083 (antes da seção "Próximos Passos") com a seguinte estrutura:

1. **Seção 8.1** - Visão Geral da Arquitetura
2. **Seção 8.2** - Status Atual do Banco de Dados
3. **Seção 8.3** - Migrações de Banco de Dados Necessárias
4. **Seção 8.4** - Atualização de RPCs
5. **Seção 8.5** - Atualização da Edge Function
6. **Seção 8.6** - Alterações no Frontend (Hooks)
7. **Seção 8.7** - Alterações no Frontend (Páginas e Componentes)
8. **Seção 8.8** - Checklist de Tarefas
9. **Seção 8.9** - Observações Importantes

---

### Detalhes Técnicos

#### Tabelas que Precisam de `unit_id`:
| Tabela | Ação |
|--------|------|
| `ah_recolhidas` | Adicionar coluna |
| `ah_ignorar_coleta` | Adicionar coluna |
| `produtividade_ah` | Adicionar coluna |

#### RPCs que Precisam de Atualização:
| RPC | Ação |
|-----|------|
| `get_todas_pessoas` | Adicionar `p_unit_id` |
| `get_correcoes_ah_stats` | Adicionar `p_unit_id` |
| `get_ah_tempo_stats` | Adicionar `p_unit_id` |

#### Edge Function:
- `register-ah` - Receber e salvar `unit_id`

#### Hooks que Precisam de Atualização:
- `use-apostilas-recolhidas.ts`
- `use-proximas-coletas-ah.ts`
- `use-alunos-ignorados-ah.ts`
- `use-todos-alunos.ts`
- `use-ah-tempo-stats.ts`
- `use-correcoes-ah-stats.ts`
- `use-pessoas-com-recolhimento-aberto.ts`
- `use-ah-correcao.ts`

#### Páginas e Componentes:
- `AbrindoHorizontesFila.tsx`
- `AbrindoHorizontesAlunos.tsx`
- `CorrecoesAbrindoHorizontes.tsx`
- `FilaApostilasTable.tsx`
- `EstatisticasAH.tsx`
- `ProximasColetasAH.tsx`
- `RecolherApostilasModal.tsx`
- `IgnorarColetaModal.tsx`

---

### Alterações no Documento

1. **Inserir Fase 8** - ~350 linhas de documentação completa
2. **Atualizar "Próximos Passos"** - Marcar Fase 8 como documentada
3. **Atualizar "Histórico de Alterações"** - Adicionar entrada para Fase 8


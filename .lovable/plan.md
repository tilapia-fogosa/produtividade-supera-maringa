

## Plano: Adicionar Fase 9 (Alertas de Evasão) ao MD de Migração

### Objetivo
Adicionar a documentação completa da Fase 9 (Tela Alertas de Evasão) ao arquivo `MIGRACAO_MULTI_UNIDADES.md`.

---

### Estrutura da Adição

A Fase 9 será adicionada após a linha 1785 (final da Fase 8, antes da seção "Próximos Passos") com a seguinte estrutura:

1. **Seção 9.1** - Visão Geral da Arquitetura
2. **Seção 9.2** - Status Atual do Banco de Dados
3. **Seção 9.3** - Migrações de Banco de Dados Necessárias
4. **Seção 9.4** - Atualização de RPCs
5. **Seção 9.5** - Alterações no Frontend (Hooks)
6. **Seção 9.6** - Alterações no Frontend (Páginas e Componentes)
7. **Seção 9.7** - Checklist de Tarefas
8. **Seção 9.8** - Observações Importantes

---

### Detalhes Técnicos

#### Tabelas que Precisam de `unit_id`:
| Tabela | Ação |
|--------|------|
| `alerta_evasao` | Adicionar coluna |
| `atividades_alerta_evasao` | Adicionar coluna |
| `kanban_cards` | Adicionar coluna |

#### RPCs que Precisam de Atualização:
| RPC | Ação |
|-----|------|
| `get_alunos_retencoes_historico` | Adicionar `p_unit_id` |
| `get_aluno_detalhes` | Adicionar `p_unit_id` |

#### Hooks que Precisam de Atualização:
- `use-alertas-evasao.ts`
- `use-alertas-evasao-lista.ts`
- `use-atividades-alerta-evasao.ts`
- `use-atividades-evasao-home.ts`
- `use-retencoes-historico.ts`
- `use-kanban-cards.ts`

#### Páginas e Componentes:
- `AlertasEvasao.tsx`
- `PainelPedagogico.tsx`
- `Retencoes.tsx`
- `AlertaEvasaoModal.tsx`
- `AtividadesDrawer.tsx`
- `PedagogicalKanban.tsx`

---

### Alterações no Documento

1. **Inserir Fase 9** - ~400 linhas de documentação completa após a linha 1785
2. **Atualizar "Próximos Passos"** - Marcar Fase 9 como documentada
3. **Atualizar "Histórico de Alterações"** - Adicionar entrada para Fase 9


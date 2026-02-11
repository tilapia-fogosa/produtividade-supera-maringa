
## Marcar Fase 7 como Concluída no documento de migração

### O que será feito
Atualizar o arquivo `MIGRACAO_MULTI_UNIDADES.md` para marcar a **Fase 7: Tela Calendário de Aulas** como concluída.

### Alterações no arquivo

1. **Linha 660** - Atualizar o título da Fase 7:
   - De: `## Fase 7: Tela Calendário de Aulas - Análise Detalhada`
   - Para: `## Fase 7: Tela Calendário de Aulas - ✅ CONCLUÍDA`

2. **Adicionar data de conclusão** logo abaixo do título (11/02/2026)

3. **Marcar todos os itens do checklist (linhas 998-1048)** com `[x]`:
   - RPCs atualizadas (`get_lista_completa_reposicoes` e `get_lista_aulas_experimentais`)
   - Hooks atualizados (`use-lista-reposicoes`, `use-lista-aulas-experimentais`, `use-lista-faltas-futuras`)
   - Hooks agora usam `useActiveUnit` internamente (ao invés de receber unitId como prop nos modais)

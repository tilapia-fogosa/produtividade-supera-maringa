

## Criar Arquivo de Plano de Migração Multi-Unidades

### Objetivo
Criar o arquivo `MIGRACAO_MULTI_UNIDADES.md` na raiz do projeto documentando todo o plano de migração do sistema para suportar múltiplas unidades.

### Arquivo a ser Criado

**`MIGRACAO_MULTI_UNIDADES.md`**

O arquivo conterá:

1. **Visão Geral** - Descrição do objetivo da migração
2. **Análise do Estado Atual** - Tabelas que já possuem `unit_id` vs as que faltam
3. **Fase 1: Tabelas de Produtividade** - SQL para adicionar `unit_id` em `produtividade_abaco` e `produtividade_ah`
4. **Fase 2: Atualização de Código** - Hooks e Edge Functions que precisam ser modificados
5. **Fase 3: Verificação** - Confirmação das tabelas `alunos` e `professores`
6. **Fase 4: Tabelas Futuras** - Outras tabelas que precisarão de revisão
7. **Checklist de Tarefas** - Lista completa de tarefas para execução
8. **Detalhes Técnicos** - Estrutura atual das tabelas de produtividade

### Conteúdo Técnico

O documento incluirá os scripts SQL necessários para:
- Adicionar coluna `unit_id` nas tabelas de produtividade
- Popular dados existentes baseado no `pessoa_id` vinculado
- Criar índices de performance
- Tornar a coluna NOT NULL após migração de dados


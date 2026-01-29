

## Atualizar Documento de Migração Multi-Unidades

### Objetivo
Adicionar ao arquivo `MIGRACAO_MULTI_UNIDADES.md` uma nova seção documentando a análise detalhada da tela Home, incluindo todas as fontes de dados e hooks que precisam ser corrigidos para suportar multi-unidades.

### Conteúdo a ser Adicionado

**Nova Seção: Fase 5 - Tela Home (Dashboard)**

#### 5.1 Visão Geral da Arquitetura
A tela Home é uma agregação de **13+ fontes de dados** diferentes, não uma tabela única. Os dados são carregados dinamicamente baseados no perfil do usuário (Professor vs Administrativo).

#### 5.2 Tabelas Envolvidas
| Tabela | Uso na Home | Status unit_id |
|--------|-------------|----------------|
| `tarefas_pessoais` | Tarefas do usuário | Verificar |
| `alunos` | Aniversariantes, camisetas, coletas | OK |
| `funcionarios` | Aniversariantes funcionários | OK |
| `camisetas` | Entregas pendentes | Não possui |
| `ah_recolhidas` | Apostilas para entregar | Não possui |
| `eventos_professor` | Aulas inaugurais | Verificar |
| `alerta_evasao` | Alertas de evasão | Não possui |
| `atividades_alerta_evasao` | Atividades pendentes | Não possui |
| `pos_venda_dados` | Pós-matrículas incompletas | Verificar |
| `reposicoes` (RPC) | Reposições do dia | Verificar |
| `aulas_experimentais` (RPC) | Aulas experimentais | Verificar |
| `pendencias_botom` | Entregas de botom | Verificar |

#### 5.3 Hooks que Precisam de Correção
| Hook | Problema | Ação Necessária |
|------|----------|-----------------|
| `use-camisetas.ts` | Não filtra por unidade | Adicionar filtro unit_id |
| `use-proximas-coletas-ah.ts` | Busca todos alunos/funcionários | Filtrar por activeUnit |
| `use-apostilas-recolhidas.ts` | Não filtra por unidade | Adicionar filtro unit_id |
| `use-atividades-evasao-home.ts` | Não filtra por unidade | Adicionar filtro unit_id |
| `use-aulas-inaugurais-professor.ts` | Não filtra por unidade | Adicionar filtro unit_id |
| `use-professor-atividades.ts` | Busca turmas sem filtro de unidade | Filtrar turmas por activeUnit |

#### 5.4 Hooks que já Suportam Multi-Unidades
- `use-aniversariantes.ts` - Filtra por unit_id
- `use-pos-matriculas-incompletas.ts` - Filtra via aluno.unit_id
- RPCs `get_lista_aulas_experimentais` e `get_lista_completa_reposicoes` - Recebem unit_id

#### 5.5 Checklist de Tarefas - Tela Home
- [ ] Adicionar `unit_id` na tabela `camisetas`
- [ ] Adicionar `unit_id` na tabela `ah_recolhidas`
- [ ] Adicionar `unit_id` na tabela `alerta_evasao`
- [ ] Adicionar `unit_id` na tabela `atividades_alerta_evasao`
- [ ] Atualizar `use-camisetas.ts` para filtrar por unidade
- [ ] Atualizar `use-proximas-coletas-ah.ts` para usar activeUnit
- [ ] Atualizar `use-apostilas-recolhidas.ts` para filtrar por unidade
- [ ] Atualizar `use-atividades-evasao-home.ts` para filtrar por unidade
- [ ] Atualizar `use-aulas-inaugurais-professor.ts` para filtrar por unidade
- [ ] Atualizar `use-professor-atividades.ts` para filtrar turmas por unidade

### Arquivo a ser Modificado
- `MIGRACAO_MULTI_UNIDADES.md` - Adicionar nova seção após a Fase 4




## Implementar Página de Comissões

### Resumo
Construir a pagina de Comissoes com duas abas (Comissoes e Configuracoes), filtro por mes/ano, tabela de matriculas e totalizador.

### Estrutura da Pagina

A pagina tera:
- Duas abas no topo: **Comissoes** e **Configuracoes**
- A aba Configuracoes so aparece para perfil `franqueado`
- Na aba Comissoes:
  - Seletor de mes/ano (padrao: mes atual)
  - Tabela com as colunas: Nome do Aluno, Vendedor, Valor Mensalidade, Valor Material, Valor Matricula, Status
  - Totalizador na parte inferior somando os valores

### Dados
Os dados vem da tabela `atividade_pos_venda` (ja existente), filtrando por `unit_id` e pelo mes/ano selecionado no campo `created_at`. O nome do vendedor sera buscado na tabela `profiles` usando o campo `created_by`.

### Mapeamento de Campos

| Coluna na Tela | Campo no Banco |
|---|---|
| Nome do Aluno | `full_name` ou `client_name` |
| Vendedor | `created_by` -> `profiles.full_name` |
| Valor Mensalidade | `monthly_fee_amount` |
| Valor Material | `material_amount` |
| Valor Matricula | `enrollment_amount` |
| Status | `status_manual` |

### Detalhes Tecnicos

**Arquivos a criar/editar:**

1. **`src/hooks/use-comissoes.ts`** (novo) - Hook para buscar dados de comissoes filtrados por mes/ano da unidade ativa. Busca na `atividade_pos_venda` e faz join com `profiles` para o nome do vendedor.

2. **`src/pages/Comissao.tsx`** (editar) - Substituir placeholder pela implementacao completa:
   - Componente `Tabs` com duas abas
   - Filtro de mes/ano usando `Select` (mes) + `Select` (ano)
   - Tabela HTML com as colunas definidas
   - Totalizador com soma de Valor Mensalidade, Valor Material e Valor Matricula
   - Controle de visibilidade da aba Configuracoes baseado no perfil do usuario (`useAuth`)

3. **Nenhuma alteracao no banco de dados** - Todos os campos necessarios ja existem na tabela `atividade_pos_venda`.

### Filtro de Mes/Ano
- Dois selects lado a lado: um para mes (Janeiro-Dezembro) e outro para ano
- Padrao: mes e ano atuais
- Ao mudar, refaz a consulta filtrando `created_at` pelo primeiro e ultimo dia do mes selecionado

### Totalizador
- Linha fixa no rodape da tabela
- Soma total de: Valor Mensalidade, Valor Material, Valor Matricula
- Valores formatados em R$ (moeda brasileira)


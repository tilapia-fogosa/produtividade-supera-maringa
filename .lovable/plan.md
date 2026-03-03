

## Diagnóstico

A RPC `get_commercial_conversations_by_phone` está dando **timeout** (erro 57014). A causa é a combinação de:

1. **Falta de índice** na coluna `telefone` da tabela `historico_comercial`
2. **Subconsultas correlacionadas** com `REGEXP_REPLACE` executadas para cada um dos 324 telefones únicos, cruzando com `alunos` e `clients` sem índices adequados
3. **Múltiplas subconsultas por linha** (nome, origem, última mensagem, contagem, unread) — são ~7 subconsultas por telefone

## Plano de Correção

### 1. Criar índices necessários
- Índice em `historico_comercial(telefone)`
- Índice em `historico_comercial(telefone, created_at DESC)` para otimizar a busca da última mensagem
- Índice em `historico_comercial(telefone, lida, from_me)` para contagem de não lidas

### 2. Reescrever a RPC otimizada
A nova versão vai:
- Usar **CTEs materializadas** para pré-calcular a última mensagem, contagem total e unread count por telefone de uma vez só (em vez de subconsultas por linha)
- Pré-computar os últimos 10 dígitos dos telefones de `alunos` e `clients` uma única vez e fazer JOIN, eliminando os `REGEXP_REPLACE` repetidos
- Manter a mesma interface de retorno para não precisar alterar o frontend

### Detalhes Técnicos

```text
Antes (N subconsultas por telefone):
  Para cada telefone:
    → subconsulta última mensagem
    → subconsulta última data
    → subconsulta contagem total
    → subconsulta unread
    → subconsulta nome (com REGEXP em alunos)
    → subconsulta nome (com REGEXP em clients)
    → subconsulta origem
    → subconsulta alterar_nome

Depois (tudo pré-calculado):
  CTE 1: Agregar por telefone (última msg, contagem, unread) - 1 scan
  CTE 2: Normalizar telefones de alunos - 1 scan
  CTE 3: Normalizar telefones de clients - 1 scan
  JOIN final: combinar tudo
```

Nenhuma alteração no frontend será necessária.


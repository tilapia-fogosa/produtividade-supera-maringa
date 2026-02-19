
# Correção: Salvar salas na aba de configurações

## Problema identificado

A coluna `id` da tabela `salas` nao possui um valor padrão (`DEFAULT gen_random_uuid()`). Quando o codigo tenta inserir uma nova sala sem fornecer um `id`, o banco de dados rejeita a operacao porque `id` e NOT NULL e nao tem fallback.

## Solucao

Adicionar o valor padrão `gen_random_uuid()` na coluna `id` da tabela `salas` via migration SQL:

```sql
ALTER TABLE public.salas ALTER COLUMN id SET DEFAULT gen_random_uuid();
```

## Detalhes tecnicos

- **Arquivo afetado**: Nenhum arquivo de codigo precisa ser alterado.
- **Alteracao**: Apenas uma migration SQL para corrigir o schema da tabela `salas`.
- **Impacto**: Apos a correcao, o cadastro de salas funcionara normalmente pela interface, pois o UUID sera gerado automaticamente pelo banco.



## Diagnóstico

O log mostra:
```
null value in column "unit_id" of relation "historico_comercial" violates not-null constraint
```

A coluna `unit_id` tem um valor padrão no banco (`0df79a04-444e-46ee-b218-59e4b1835f4a` = Maringá), mas a edge function passa `unit_id: null` explicitamente, sobrescrevendo o default.

## Plano

### 1. Edge function `send-whatsapp-message` - Corrigir unit_id no insert

Na linha do insert, trocar:
```typescript
unit_id: unit_id || null
```
Por: simplesmente não incluir `unit_id` quando estiver vazio, para o default do banco ser usado:
```typescript
...(unit_id ? { unit_id } : {})
```

### 2. ChatInput - Otimizar envio removendo query extra de profile

O fluxo atual faz:
1. `getUser()` → pega user id
2. Query `profiles` → pega `full_name`
3. `send-whatsapp-message` → envia

A query ao `profiles` pode ser eliminada buscando o nome do `user_metadata` que já vem no `getUser()`. Isso remove uma chamada ao banco.

### 3. ChatInput - Enviar unit_id do conversation

O `conversation` já tem `unitId`. Garantir que está sendo passado corretamente (já está no código atual, mas se vier vazio, a edge function precisa tratar).



# Evitar Duplicacao de Eventos de Aula Inaugural

## Problema
Atualmente, toda vez que o formulario de "Dados Iniciais" e salvo, um novo evento `aula_zero` e inserido na tabela `eventos_professor`, sem verificar se ja existe um evento para aquele cliente. Isso causa duplicatas se o formulario for salvo mais de uma vez.

## Solucao

### 1. Migracao de Banco de Dados
Adicionar coluna `client_id` na tabela `eventos_professor` para rastrear qual cliente originou o evento de aula inaugural:

```sql
ALTER TABLE public.eventos_professor 
ADD COLUMN client_id UUID REFERENCES public.clients(id);
```

### 2. Alteracao no DadosFinaisForm.tsx
Modificar a logica de criacao do evento na `mutationFn`:

- **Antes de inserir** um novo evento, buscar e **deletar** eventos existentes do tipo `aula_zero` vinculados ao mesmo `client_id`
- Ao inserir o novo evento, incluir o `client_id` do cliente no registro

Fluxo atualizado:
1. Deletar qualquer evento existente: `DELETE FROM eventos_professor WHERE client_id = X AND tipo_evento = 'aula_zero'`
2. Inserir o novo evento com o `client_id` preenchido

### Detalhes Tecnicos

**Migracao SQL:**
```sql
ALTER TABLE public.eventos_professor 
ADD COLUMN client_id UUID REFERENCES public.clients(id);
```

**Logica no DadosFinaisForm.tsx (linhas 255-281):**
Substituir o bloco atual de criacao de evento por:
```typescript
// Remover evento anterior de aula inaugural deste cliente
await supabase
  .from('eventos_professor')
  .delete()
  .eq('client_id', cliente.id)
  .eq('tipo_evento', 'aula_zero');

// Criar novo evento
const { error: eventoError } = await supabase
  .from('eventos_professor')
  .insert({
    ...eventoData,
    client_id: cliente.id,
  });
```

Isso garante que sempre existira no maximo 1 evento de aula inaugural por cliente.



# Otimizacao do Salvamento do Drawer de Aula Zero

## Problema Identificado

O salvamento esta lento porque 3 operacoes sao executadas **sequencialmente** (uma esperando a outra terminar):
1. UPDATE em `atividade_pos_venda`
2. SELECT + UPDATE em `alunos`  
3. Chamada a edge function `webhook-aula-inaugural` (que espera resposta do webhook externo)

A etapa 3 e a mais lenta, pois envolve uma chamada HTTP externa e o codigo espera (`await`) a resposta completa antes de fechar o drawer.

## Solucao Proposta

Reorganizar o fluxo para que o webhook **nao bloqueie** o fechamento do drawer:

1. **Etapas 1 e 2 em paralelo**: Executar o update em `atividade_pos_venda` e a busca/update em `alunos` simultaneamente usando `Promise.all`
2. **Webhook sem await**: Disparar a chamada ao webhook **sem esperar** a resposta (fire-and-forget). O drawer fecha imediatamente apos salvar no banco.

## Detalhes Tecnicos

**Arquivo:** `src/components/aula-zero/AulaZeroDrawer.tsx`

Alterar o `onSubmit` para:

```text
1. Promise.all([
     - update atividade_pos_venda
     - buscar aluno + update alunos (se existir)
   ])
2. Fechar drawer e resetar form
3. supabase.functions.invoke('webhook-aula-inaugural', ...) 
   // SEM await - dispara e esquece
```

Isso reduzira o tempo de salvamento significativamente, pois:
- As 2 operacoes de banco rodam em paralelo (ao inves de sequenciais)
- O webhook nao bloqueia mais o fechamento do drawer


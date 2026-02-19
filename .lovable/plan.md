
# Corrigir filtro por client_id no AulaZeroDrawer e Home + enviar atividade_pos_venda_id no webhook

## Problema

Quando voce finaliza a aula inaugural do "teste 4.4", o sistema atualiza `atividade_pos_venda` usando `.eq('client_id', clientId)`. Como "teste 4" e "teste 4.4" compartilham o mesmo `client_id`, ambas sao atualizadas e somem do dashboard.

Alem disso, o webhook nao envia o `atividade_pos_venda_id`.

## Arquivos e mudancas

### 1. `src/pages/Home.tsx`

- Adicionar campo `atividade_pos_venda_id` na interface `Evento`
- Nos dois blocos onde se cria eventos de aula inaugural (admin e professor), mapear `ai.atividade_pos_venda_id` para o evento
- No `handleAulaInauguralClick`, usar `atividade_pos_venda_id` em vez de `client_id` para buscar o nome e abrir o drawer
- Passar `atividade_pos_venda_id` para o `AulaZeroDrawer` em vez de `client_id`
- Atualizar a checagem de clicavel para usar `atividade_pos_venda_id`

### 2. `src/components/aula-zero/AulaZeroDrawer.tsx`

- Trocar a prop `clientId` por `atividadePosVendaId`
- Na busca de dados existentes (useEffect), trocar `.eq('client_id', clientId)` por `.eq('id', atividadePosVendaId)`
- No update, trocar `.eq('client_id', clientId)` por `.eq('id', atividadePosVendaId)`
- No webhook, enviar `atividade_pos_venda_id` no payload em vez de `client_id`
- Manter a busca do aluno por `client_id` (precisa buscar o `client_id` a partir da atividade)

### 3. `src/components/painel-administrativo/DadosFinaisForm.tsx`

- Adicionar `atividade_pos_venda_id` ao payload do webhook de agendamento

## Detalhes tecnicos

### Interface Evento atualizada

```text
interface Evento {
  ...
  aula_inaugural_client_id?: string;       // manter para compatibilidade
  aula_inaugural_atividade_id?: string;     // NOVO
}
```

### AulaZeroDrawer - prop atualizada

```text
interface AulaZeroDrawerProps {
  ...
  atividadePosVendaId: string;   // era clientId
  alunoNome: string;
  ...
}
```

### Logica de update corrigida

```text
// ANTES (atualiza TODAS as atividades do mesmo cliente)
supabase.from('atividade_pos_venda').update(fields).eq('client_id', clientId)

// DEPOIS (atualiza apenas a atividade especifica)
supabase.from('atividade_pos_venda').update(fields).eq('id', atividadePosVendaId)
```

### Webhook payload atualizado

```text
// AulaZeroDrawer - lancamento
{
  atividade_pos_venda_id: atividadePosVendaId,  // NOVO
  client_name: alunoNome,
  ...
  tipo: 'lancamento_aula_zero',
}

// DadosFinaisForm - agendamento
{
  atividade_pos_venda_id: cliente.atividade_pos_venda_id,  // NOVO
  nome_aluno: nomeAluno,
  ...
}
```

### Busca do aluno vinculado

O drawer precisa buscar o `client_id` a partir da `atividade_pos_venda` para depois encontrar o aluno:

```text
const { data: atividade } = await supabase
  .from('atividade_pos_venda')
  .select('client_id')
  .eq('id', atividadePosVendaId)
  .maybeSingle();

if (atividade?.client_id) {
  const { data: aluno } = await supabase
    .from('alunos')
    .select('id')
    .eq('client_id', atividade.client_id)
    .maybeSingle();
  // atualizar aluno...
}
```

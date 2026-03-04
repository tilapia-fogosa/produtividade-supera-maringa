

## Plano: Mover envio do webhook para quando o Acordeão 2 for concluído

### Situação atual
O webhook `webhook-aula-inaugural` é disparado dentro do fluxo de salvamento (`mutation`), condicionado à existência de `dataAulaInaugural`, `horarioSelecionado` e `professorSelecionado` (linhas 418-458).

### Mudança proposta
Mover o disparo do webhook para um `useEffect` que observa `isAccordion2Complete`. Quando o acordeão 2 for marcado como completo (foto + lançar SGS + sincronizar SGS + vincular aluno), o webhook é disparado automaticamente, independente do botão "Salvar".

### Detalhes técnicos

1. **Criar um `useRef` de controle** (`webhookEnviado`) para garantir que o webhook seja disparado apenas uma vez por sessão da drawer.

2. **Adicionar um `useEffect`** que dispara quando `isAccordion2Complete` muda para `true`:
   - Coleta os dados necessários (nome do aluno, unit_id, dados da aula inaugural, kit, descritivo comercial)
   - Invoca `supabase.functions.invoke('webhook-aula-inaugural', { body: payload })`
   - Marca `webhookEnviado.current = true` para evitar re-envios

3. **Remover o bloco de webhook** (linhas 418-458) de dentro do `mutationFn`, mantendo todo o restante da lógica de salvamento intacto.

### Arquivo alterado
- `src/components/painel-administrativo/DadosFinaisForm.tsx`


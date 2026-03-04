

## Problema

O `handleToggle` e as demais alterações de campos (kit, foto, aula inaugural, aluno vinculado) só atualizam o estado local do React. Os dados só são persistidos quando o usuário clica "Salvar" no final. Porém, o fluxo de acordeões auto-avançando dá a impressão de salvamento automático, e o webhook já dispara baseado no estado local.

## Solução: Auto-save por acordeão

Implementar salvamento automático quando cada acordeão é concluído (ao avançar para o próximo). O botão "Salvar" no final continua existindo como fallback para salvar dados do accordion 3.

## Alterações

**`src/components/painel-administrativo/DadosFinaisForm.tsx`**

1. **Criar função `saveAccordionData`**: Extrair a lógica de persistência da `mutation.mutationFn` para uma função reutilizável que salva os dados atuais no banco (checklist, foto, kit, aula inaugural, vínculo de aluno).

2. **Auto-save no useEffect de avanço do accordion 1→2**: Quando `isAccordion1Complete` se torna true e o accordion avança, chamar `saveAccordionData` para persistir dados do accordion 1 (data aula inaugural, horário, kit, descritivo comercial, check_entregar_kit).

3. **Auto-save no useEffect de avanço do accordion 2→3**: Quando `isAccordion2Complete` se torna true e o accordion avança, chamar `saveAccordionData` para persistir dados do accordion 2 (foto, check_lancar_sgs, check_sincronizar_sgs, vínculo de aluno) -- isso acontece **antes** do webhook disparar.

4. **Manter botão Salvar**: O botão final continua funcionando para salvar dados do accordion 3 (contrato, pagamento, whatsapp) e como fallback geral.

5. **Adicionar flag `isSavingAuto`**: Para mostrar um indicador sutil de "salvando..." durante o auto-save, sem bloquear a UI.

6. **Invalidar queries após auto-save**: Chamar `queryClient.invalidateQueries` após cada auto-save para manter a listagem atualizada.

## Fluxo resultante

```text
Accordion 1 completo → auto-save dados accordion 1 → abre accordion 2
Accordion 2 completo → auto-save dados accordion 2 → dispara webhook → abre accordion 3
Botão Salvar → salva todos os dados pendentes (accordion 3 + qualquer alteração)
```


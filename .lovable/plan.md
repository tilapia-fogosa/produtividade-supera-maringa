
Objetivo: destravar de vez o cadastro de lead (não apenas “ajuste de campo”), cobrindo frontend + regra de banco.

Diagnóstico confirmado
1) Bloqueio principal no insert: o modal comercial grava `status: 'novo'`, mas a tabela `clients` só aceita valores como `novo-cadastro`, `tentativa-contato`, etc. Isso gera falha de constraint.
2) Unidade incorreta no formulário: em `NewClientDrawer` (comercial), o `unit_id` nasce do `defaultValues` (executa uma vez) e o `reset` só roda quando `phoneNumber` existe. Ao abrir “Adicionar Cliente” com telefone vazio, pode ficar travado no fallback (Maringá) sem sincronizar com a unidade ativa do usuário.
3) Inconsistência de tela: existe outro modal em `src/pages/whatsapp/components/NewClientDrawer.tsx` ainda com título “Cadastrar Contato do WhatsApp” e fluxo mock (não persiste no banco). Se o usuário estiver nessa rota, nunca vai cadastrar lead de verdade.
4) RLS de `clients`: as policies existem, porém a tabela está com `relrowsecurity=false` (RLS desativado), então a validação por política não está efetivamente em uso.

Do I know what the issue is? Sim.

Plano de implementação
1) Corrigir o insert no modal comercial (`src/pages/whatsapp-comercial/components/NewClientDrawer.tsx`)
- Trocar `status: 'novo'` para `status: 'novo-cadastro'` (ou remover e usar default do banco).
- Manter `observations` como já está.
- Incluir tratamento de erro visível no próprio modal (mensagem inline), sem toast.

2) Corrigir seleção de unidade no modal comercial
- Passar a usar `useActiveUnit()` como fonte principal do `unit_id`.
- Fallback para Maringá apenas quando não houver unidade ativa.
- Ajustar `useEffect` para resetar `unit_id` sempre que abrir o modal (não depender de `phoneNumber`).
- Exibir nome real da unidade no campo (não “Unidade Atual”), mantendo o campo bloqueado.

3) Eliminar divergência entre os dois modais de cadastro
- Unificar o modal de `/whatsapp` com o modal funcional do `/whatsapp-comercial` (componente compartilhado), para não existir uma versão mock com título antigo.
- Garantir que em ambos os fluxos o título seja “Cadastrar Lead”.

4) Reforçar RLS da tabela `clients` (migração SQL)
- `ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;`
- Revisar políticas para INSERT/UPDATE/DELETE garantindo acesso para:
  - admin (global)
  - sdr e consultor na unidade do registro
- Usar funções já existentes (`has_role`, `user_has_role_in_unit`) para evitar acoplamento frágil nas policies.

5) Validação pós-correção (fim a fim)
- Testar cadastro em 3 pontos: `/whatsapp`, `/whatsapp-comercial`, `/clientes-unidade`.
- Testar com perfis admin, sdr e consultor.
- Confirmar:
  - título “Cadastrar Lead” em todos os fluxos
  - telefone editável quando abertura for manual (sem número prévio)
  - unit_id correto da unidade ativa
  - registro criado em `clients` com status válido
  - sem erro de constraint/RLS no insert.

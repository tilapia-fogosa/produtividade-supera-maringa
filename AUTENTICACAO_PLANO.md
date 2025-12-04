# Plano de Implementação de Autenticação

## 📊 Status Geral
- [ ] Fase 1: Segurança do Banco de Dados
- [ ] Fase 2: Proteção de Rotas
- [ ] Fase 3: Configuração de Emails (Resend)
- [ ] Fase 4: RLS em todas as tabelas
- [ ] Fase 5: Melhorias UX

---

## ✅ O QUE JÁ EXISTE

### Autenticação
- [x] Página de login (`src/pages/Login.tsx`)
- [x] AuthContext configurado (`src/contexts/AuthContext.tsx`)
- [x] Hook de permissões (`src/hooks/useUserPermissions.ts`)
- [x] Componente ProtectedRoute (DESATIVADO)

### Banco de Dados
- [x] Tabela `profiles` (58 usuários)
- [x] Tabela `unit_users` com roles (admin, franqueado, gestor_pedagogico, consultor)
- [x] Tabela `units` com unidades

### Componentes
- [x] UnitSelector para trocar unidade ativa
- [x] AppSidebar com navegação

---

## ❌ O QUE PRECISA SER FEITO

### FASE 1: Segurança do Banco de Dados (PRIORIDADE ALTA)

#### 1.1 Criar funções SQL seguras
- [ ] `get_user_role(user_id)` - Retorna role do usuário
- [ ] `get_user_unit_ids(user_id)` - Retorna array de unit_ids
- [ ] `has_unit_access(user_id, unit_id)` - Verifica acesso à unidade

#### 1.2 Proteger tabela unit_users
- [ ] Habilitar RLS
- [ ] Política: usuários veem seus próprios registros
- [ ] Política: admins podem gerenciar tudo

#### 1.3 Proteger tabela profiles
- [ ] Habilitar RLS
- [ ] Política: usuários veem/editam próprio perfil

---

### FASE 2: Proteção de Rotas (PRIORIDADE ALTA)

#### 2.1 Reativar ProtectedRoute.tsx
- [ ] Remover bypass de autenticação
- [ ] Adicionar verificação de login
- [ ] Adicionar verificação de permissão de página
- [ ] Redirecionar para login se não autenticado
- [ ] Redirecionar para access-denied se sem permissão

#### 2.2 Atualizar mapeamento de permissões
- [ ] Mapear TODAS as rotas do sistema
- [ ] Definir roles permitidos para cada rota

---

### FASE 3: Configuração de Emails - Resend (PRIORIDADE ALTA)

#### 3.1 Configuração Inicial
- [ ] Criar conta no Resend (https://resend.com)
- [ ] Validar domínio de email (https://resend.com/domains)
  - ⚠️ SEM DOMÍNIO VALIDADO: só envia para o email do dono da conta
  - ✅ COM DOMÍNIO VALIDADO: pode enviar para qualquer email
- [ ] Criar API Key (https://resend.com/api-keys)
- [ ] Adicionar secret `RESEND_API_KEY` no Supabase

#### 3.2 Edge Function para Recuperação de Senha
- [ ] Criar edge function `send-password-reset`
- [ ] Integrar com `supabase.auth.resetPasswordForEmail()`
- [ ] Template de email personalizado

#### 3.3 Edge Function para Confirmação de Email
- [ ] Criar edge function `send-email-confirmation`
- [ ] Template de email de boas-vindas
- [ ] Link de confirmação

#### 3.4 Configurar URLs de Redirect no Supabase
- [ ] Configurar `emailRedirectTo` para confirmação
- [ ] Configurar URL de reset de senha
- [ ] Adicionar domínios permitidos nas configurações do Supabase Auth

#### 3.5 Templates de Email
- [ ] Template: Recuperação de senha
- [ ] Template: Confirmação de cadastro
- [ ] Template: Boas-vindas após confirmação

---

### FASE 4: Habilitar RLS nas Tabelas (PRIORIDADE MÉDIA)

#### Tabelas COM unit_id (precisam de RLS por unidade):
- [ ] alerta_evasao
- [ ] alertas_falta
- [ ] alertas_lancamento
- [ ] alunos
- [ ] aulas_experimentais
- [ ] bloqueios_horario_professor
- [ ] camisetas
- [ ] class_types
- [ ] classes
- [ ] client_activities
- [ ] client_loss_reasons
- [ ] clients
- [ ] desafios_2025
- [ ] devolutivas_config
- [ ] disponibilidade_professores
- [ ] estoque
- [ ] estoque_movimentacoes
- [ ] estagiarios
- [ ] eventos_professores
- [ ] eventos_salas
- [ ] exercicios_abaco_2025
- [ ] exercicios_ah_2025
- [ ] faltas_futuras
- [ ] funcionarios
- [ ] kanban_cards
- [ ] observacoes_alunos
- [ ] pessoas_turma
- [ ] produtividade
- [ ] produtividade_ah
- [ ] professores
- [ ] projeto_sao_rafael
- [ ] projeto_sao_rafael_textos
- [ ] reposicoes
- [ ] responsaveis
- [ ] resultados_alunos
- [ ] retencoes
- [ ] salas
- [ ] turmas

#### Tabelas SEM unit_id (precisam de RLS diferente):
- [ ] ah_ignorar_coleta
- [ ] ah_recolhidas
- [ ] apostilas
- [ ] apostilas_ah
- [ ] aulas
- [ ] backup_metadata
- [ ] calendar_events
- [ ] client_webhook_logs
- [ ] client_webhooks
- [ ] lead_sources
- [ ] loss_reason_categories
- [ ] loss_reasons
- [ ] profiles
- [ ] regions
- [ ] system_pages
- [ ] system_updates
- [ ] unit_users
- [ ] units
- [ ] user_calendar_settings
- [ ] user_update_reads
- [ ] webhook_credentials

---

### FASE 5: Melhorias UX (PRIORIDADE BAIXA)

- [ ] Adicionar botão "Esqueci minha senha" na tela de login
- [ ] Criar página de reset de senha
- [ ] Criar página de gestão de usuários (admin)
- [ ] Adicionar indicador de role/unidade no header
- [ ] Melhorar loading states
- [ ] Mensagens de erro mais claras
- [ ] Fluxo de primeiro acesso (definir senha)

---

## 📋 POLÍTICAS RLS PADRÃO

### Para tabelas com unit_id:
```sql
-- SELECT
CREATE POLICY "select_by_unit" ON tabela
FOR SELECT TO authenticated
USING (public.has_unit_access(auth.uid(), unit_id));

-- INSERT
CREATE POLICY "insert_by_unit" ON tabela
FOR INSERT TO authenticated
WITH CHECK (public.has_unit_access(auth.uid(), unit_id));

-- UPDATE
CREATE POLICY "update_by_unit" ON tabela
FOR UPDATE TO authenticated
USING (public.has_unit_access(auth.uid(), unit_id))
WITH CHECK (public.has_unit_access(auth.uid(), unit_id));

-- DELETE
CREATE POLICY "delete_by_unit" ON tabela
FOR DELETE TO authenticated
USING (public.has_unit_access(auth.uid(), unit_id));
```

---

## 📧 EXEMPLO EDGE FUNCTION RESEND

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, type, resetLink } = await req.json();

    let subject = "";
    let html = "";

    if (type === "password-reset") {
      subject = "Recuperação de Senha - SUPERA";
      html = `
        <h1>Recuperação de Senha</h1>
        <p>Você solicitou a recuperação de senha.</p>
        <p><a href="${resetLink}">Clique aqui para redefinir sua senha</a></p>
        <p>Se você não solicitou isso, ignore este email.</p>
      `;
    } else if (type === "welcome") {
      subject = "Bem-vindo ao SUPERA!";
      html = `
        <h1>Bem-vindo!</h1>
        <p>Sua conta foi criada com sucesso.</p>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "SUPERA <noreply@seudominio.com>",
      to: [email],
      subject,
      html,
    });

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
```

---

## 🔑 MAPEAMENTO DE ROLES

| Role | Descrição | Acesso |
|------|-----------|--------|
| admin | Administrador | Todas as páginas e unidades |
| franqueado | Dono da franquia | Suas unidades |
| gestor_pedagogico | Gestor pedagógico | Suas unidades |
| consultor | Consultor | Suas unidades |
| educador | Professor/Educador | Suas unidades |

---

## 📁 ARQUIVOS IMPORTANTES

| Arquivo | Descrição |
|---------|-----------|
| `src/contexts/AuthContext.tsx` | Contexto de autenticação |
| `src/components/ProtectedRoute.tsx` | Proteção de rotas (DESATIVADO) |
| `src/hooks/useUserPermissions.ts` | Hook de permissões |
| `src/pages/Login.tsx` | Página de login |
| `src/components/AppSidebar.tsx` | Menu lateral |

---

## 📝 NOTAS

- A autenticação está temporariamente desabilitada no ProtectedRoute
- 58 usuários já existem na tabela profiles
- Muitas tabelas têm RLS habilitado mas com políticas permissivas (USING true)
- O sistema usa Supabase Auth para autenticação
- **RESEND**: Precisa de domínio validado para enviar emails para qualquer destinatário

---

## 🔗 LINKS ÚTEIS

- Supabase Auth Settings: https://supabase.com/dashboard/project/hkvjdxxndapxpslovrlc/auth/providers
- Supabase Edge Functions: https://supabase.com/dashboard/project/hkvjdxxndapxpslovrlc/functions
- Supabase Secrets: https://supabase.com/dashboard/project/hkvjdxxndapxpslovrlc/settings/functions
- Resend Dashboard: https://resend.com
- Resend Domains: https://resend.com/domains
- Resend API Keys: https://resend.com/api-keys

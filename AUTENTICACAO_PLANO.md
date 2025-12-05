# Plano de Implementação de Autenticação

## 📊 Status Geral
- [ ] Fase 1: Segurança do Banco de Dados
- [ ] Fase 2: Proteção de Rotas
- [ ] Fase 3: Configuração de Emails (Resend)
- [ ] Fase 4: RLS em todas as tabelas
- [ ] Fase 5: Melhorias UX
- [ ] Fase 6: Registro de Ponto
- [ ] Fase 7: Rastreamento de Lançamentos

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

### FASE 6: Registro de Ponto (PRIORIDADE MÉDIA)

#### 6.1 Lógica de Botões de Entrada/Saída
- [ ] Botão "Entrada" só disponível se:
  - Não há registro hoje, OU
  - Último registro do usuário foi "saída"
- [ ] Botão "Saída" só disponível se:
  - Último registro do usuário foi "entrada"

#### 6.2 Página de Histórico de Registros
- [ ] Criar página `/registro-ponto/historico`
- [ ] Tabela com colunas: Data, Hora, Tipo (Entrada/Saída)
- [ ] Filtros:
  - Data início (date picker)
  - Data fim (date picker)
  - Tipo de registro (entrada/saída/todos)
- [ ] Ordenação por data/hora (mais recente primeiro)
- [ ] Paginação se necessário

#### 6.3 RLS para tabela registro_ponto
- [ ] Habilitar RLS na tabela `registro_ponto`
- [ ] Política SELECT: usuário vê apenas seus próprios registros
- [ ] Política INSERT: usuário só insere com seu próprio id_usuario

#### 6.4 Arquivos a Criar/Modificar
- [ ] `src/pages/RegistroPontoHistorico.tsx` - Nova página de histórico
- [ ] `src/hooks/use-registro-ponto.ts` - Atualizar lógica de botões
- [ ] `src/pages/RegistroPonto.tsx` - Adicionar link para histórico
- [ ] `App.tsx` - Adicionar rota `/registro-ponto/historico`

---

### FASE 7: Rastreamento de Lançamentos (PRIORIDADE ALTA)

#### 7.0 Pré-requisito: Vincular profiles a funcionarios
- [ ] Adicionar coluna `funcionario_id` na tabela `profiles` (FK para `funcionarios.id`)
- [ ] Criar hook `use-current-funcionario.ts` para obter o `funcionario_id` do usuário logado
- [ ] Popular `funcionario_id` nos profiles existentes (relacionar por nome/email)

---

#### 7.1 Produtividade
**Arquivos:** `src/pages/Turmas.tsx`, `src/components/turmas/TurmasList.tsx`, hooks de produtividade

- [ ] Adicionar filtro "Minhas Turmas" (padrão ativo quando profile = professor)
  - Usa `professor_id` do `profiles` para filtrar turmas
- [ ] Ao registrar produtividade de ábaco:
  - Salvar `id_funcionario` do usuário logado
  - Modificar tabela `produtividade` (verificar se já tem coluna)
  - Atualizar hook `use-produtividade.ts`

---

#### 7.2 Aula Zero
**Arquivos:** `src/pages/AulaZero.tsx`, hooks relacionados

- [ ] Ao registrar aula zero:
  - Salvar `id_funcionario` do usuário logado
  - Verificar/adicionar coluna na tabela correspondente
  - Atualizar hook de registro

---

#### 7.3 Alerta de Evasão
**Arquivos:** 
- `src/components/alerta-evasao/AlertaEvasaoForm.tsx`
- `src/hooks/use-alertas-evasao.ts`

- [ ] Remover campo "Responsável" do formulário
- [ ] Ao registrar alerta de evasão:
  - Salvar `id_funcionario` do usuário logado automaticamente
  - Adicionar coluna `id_funcionario` na tabela `alerta_evasao` (se não existir)
  - Atualizar hook de criação de alerta

---

#### 7.4 Retenção por hora
- [ ] Nenhuma alteração necessária (por enquanto)

---

#### 7.5 Abrindo Horizontes

##### 7.5.1 Recolher Apostilas
**Arquivos:**
- `src/components/abrindo-horizontes/RecolherApostilasModal.tsx`
- `src/hooks/use-apostilas-recolhidas.ts` ou similar

- [ ] Remover campo "Responsável" do modal
- [ ] Ao registrar coleta de apostila:
  - Salvar `id_funcionario` do usuário logado automaticamente
  - Usar/adicionar coluna na tabela `ah_recolhidas`
  - Atualizar hook

##### 7.5.2 Iniciar Correção
**Arquivos:**
- `src/components/abrindo-horizontes/IniciarCorrecaoAhModal.tsx`
- `src/hooks/use-ah-iniciar-correcao.ts`

- [ ] Remover campo "Responsável pela correção" do modal
- [ ] Ao iniciar correção:
  - Salvar `id_funcionario` do usuário logado automaticamente
  - Usar coluna `responsavel_correcao_id` da tabela `ah_recolhidas`
  - Atualizar hook

##### 7.5.3 Entrega de Apostila
**Arquivos:**
- `src/components/abrindo-horizontes/EntregaAhModal.tsx`
- `src/hooks/use-ah-entrega.ts`

- [ ] Remover campo "Responsável pela Entrega" do modal
- [ ] Ao entregar apostila:
  - Salvar `id_funcionario` do usuário logado automaticamente
  - Usar coluna `responsavel_entrega_id` da tabela `ah_recolhidas`
  - Atualizar hook

---

#### 7.6 Alterações no Banco de Dados

```sql
-- Adicionar funcionario_id ao profiles
ALTER TABLE profiles ADD COLUMN funcionario_id UUID REFERENCES funcionarios(id);

-- Verificar/adicionar coluna em alerta_evasao
ALTER TABLE alerta_evasao ADD COLUMN IF NOT EXISTS id_funcionario UUID REFERENCES funcionarios(id);

-- Verificar/adicionar coluna em produtividade
ALTER TABLE produtividade ADD COLUMN IF NOT EXISTS id_funcionario UUID REFERENCES funcionarios(id);
```

---

#### 7.7 Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/hooks/use-current-funcionario.ts` | Criar | Hook para obter funcionario_id do usuário logado |
| `src/components/alerta-evasao/AlertaEvasaoForm.tsx` | Modificar | Remover campo responsável |
| `src/components/abrindo-horizontes/RecolherApostilasModal.tsx` | Modificar | Remover campo responsável |
| `src/components/abrindo-horizontes/IniciarCorrecaoAhModal.tsx` | Modificar | Remover campo responsável |
| `src/components/abrindo-horizontes/EntregaAhModal.tsx` | Modificar | Remover campo responsável |
| `src/hooks/use-alertas-evasao.ts` | Modificar | Usar funcionario_id automático |
| `src/hooks/use-ah-iniciar-correcao.ts` | Modificar | Usar funcionario_id automático |
| `src/hooks/use-ah-entrega.ts` | Modificar | Usar funcionario_id automático |
| `src/hooks/use-produtividade.ts` | Modificar | Salvar funcionario_id |
| `src/pages/Turmas.tsx` ou similar | Modificar | Adicionar filtro "Minhas Turmas" |

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

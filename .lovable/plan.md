
# Plano: Criar Atividade "Entregar Botom" por Troca de Apostila

## Resumo

Quando um aluno troca de apostila de Abaco, o sistema cria automaticamente uma atividade **"Entregar Botom"** atribuida ao professor do aluno. Esta atividade aparece:
1. Na tela **Home** como um evento pendente
2. Na pagina **/sala/turma** como um lembrete clicavel no card do aluno

Ao clicar no lembrete, abre um modal simples para confirmar a entrega do botom.

---

## Arquitetura da Solucao

### 1. Nova Tabela: `pendencias_botom`

Criaremos uma tabela dedicada para rastrear as entregas de botom pendentes:

```text
pendencias_botom
- id (uuid, PK)
- aluno_id (uuid, FK -> alunos.id)
- apostila_nova (text) - apostila para a qual trocou
- apostila_anterior (text, nullable) - apostila antes da troca
- professor_responsavel_id (uuid, FK -> professores.id)
- status ('pendente' | 'entregue')
- data_criacao (timestamp)
- data_entrega (timestamp, nullable)
- funcionario_registro_id (uuid, nullable) - quem confirmou entrega
```

### 2. Deteccao da Troca de Apostila

Alteraremos a Edge Function `register-productivity/database-service.ts` para:
1. Antes de atualizar `ultimo_nivel` no aluno, verificar se o valor anterior e diferente
2. Se for diferente (troca de apostila), buscar o professor da turma do aluno
3. Criar um registro em `pendencias_botom` com status 'pendente'

```text
Logica no database-service.ts:

SE presente E apostila_nova != apostila_atual DO ALUNO:
  -> Buscar turma_id do aluno
  -> Buscar professor_id da turma
  -> Inserir em pendencias_botom
```

### 3. Hook: `use-pendencias-botom.ts`

Novo hook para buscar e gerenciar pendencias de botom:
- Lista pendencias por professor (para professores)
- Lista todas pendencias (para admins)
- Funcao para confirmar entrega

### 4. Integracao na Tela Home

Adicionaremos no `Home.tsx`:
- Novo tipo de evento 'botom_pendente'
- Cards com icone distintivo (ex: Award/Medal)
- Exibicao na lista de eventos "Atrasados" ou "Hoje"

### 5. Integracao na Pagina /sala/turma

#### 5.1 Hook `use-lembretes-alunos.ts`
Adicionar nova propriedade:
```typescript
interface LembretesAluno {
  // ... campos existentes
  botomPendente: boolean;
  botomDados?: {
    pendenciaId: string;
    apostilaNova: string;
  };
}
```

Buscar na tabela `pendencias_botom` WHERE aluno_id IN (...) AND status = 'pendente'

#### 5.2 Componente `SalaAlunosListaTable.tsx`
- Novo lembrete visual com icone de medalha/premio
- Clicavel -> abre modal de confirmacao

### 6. Modal `EntregaBotomModal.tsx`

Modal simples de confirmacao:
- Nome do aluno
- Apostila para a qual trocou
- Botao "Confirmar Entrega"
- Atualiza status para 'entregue' e registra data/funcionario

---

## Detalhes Tecnicos

### Migracao SQL

```sql
-- Criar tabela de pendencias de botom
CREATE TABLE pendencias_botom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  apostila_nova TEXT NOT NULL,
  apostila_anterior TEXT,
  professor_responsavel_id UUID REFERENCES professores(id),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'entregue')),
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_entrega TIMESTAMPTZ,
  funcionario_registro_id UUID
);

-- Indices para performance
CREATE INDEX idx_pendencias_botom_aluno ON pendencias_botom(aluno_id);
CREATE INDEX idx_pendencias_botom_professor ON pendencias_botom(professor_responsavel_id);
CREATE INDEX idx_pendencias_botom_status ON pendencias_botom(status);

-- RLS
ALTER TABLE pendencias_botom ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados podem ver pendencias"
  ON pendencias_botom FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados podem inserir pendencias"
  ON pendencias_botom FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados podem atualizar pendencias"
  ON pendencias_botom FOR UPDATE TO authenticated USING (true);
```

### Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/hooks/use-pendencias-botom.ts` | Hook para buscar e gerenciar pendencias |
| `src/components/botom/EntregaBotomModal.tsx` | Modal de confirmacao de entrega |

### Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/register-productivity/database-service.ts` | Adicionar logica de deteccao de troca e criacao de pendencia |
| `src/hooks/sala/use-lembretes-alunos.ts` | Adicionar busca de pendencias de botom |
| `src/components/sala/SalaAlunosListaTable.tsx` | Adicionar lembrete visual e modal |
| `src/pages/Home.tsx` | Adicionar eventos de botom pendente |
| `src/hooks/use-professor-atividades.ts` | Adicionar busca de botom pendentes do professor |

---

## Fluxo de Usuario

### Professor na Sala de Aula

1. Professor registra produtividade com nova apostila
2. Sistema detecta troca e cria pendencia automaticamente
3. Na proxima vez que abrir a turma, ve lembrete "Entregar Botom" no card do aluno
4. Clica no lembrete -> abre modal
5. Confirma entrega -> lembrete desaparece

### Professor/Admin na Home

1. Na lista de eventos, ve "Botom: [Nome do Aluno]"
2. Pode ver detalhes (apostila nova)
3. Eventos aparecem como "Atrasados" ou por data

---

## Ordem de Implementacao

1. Criar tabela `pendencias_botom` (migracao SQL)
2. Modificar Edge Function para detectar troca e criar pendencia
3. Criar hook `use-pendencias-botom.ts`
4. Criar modal `EntregaBotomModal.tsx`
5. Integrar no `use-lembretes-alunos.ts`
6. Integrar no `SalaAlunosListaTable.tsx`
7. Integrar na Home (eventos)
8. Testar fluxo completo

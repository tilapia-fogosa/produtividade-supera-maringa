

## Plano: Criar tabela `aulas_inaugurais` dedicada

### Contexto atual

Dados de aulas inaugurais estão fragmentados:
- **`eventos_professor`** → agendamento (data, horário, professor) com `tipo_evento = 'aula_zero'`
- **`atividade_pos_venda`** → dados pedagógicos (percepção, avaliação ábaco/AH, pontos atenção)
- **`alunos`** → cópia dos mesmos campos pedagógicos (sincronização manual)
- Existem **4 registros** de aula_zero atualmente no banco

A nova tabela centraliza tudo e permite rastreamento de status, histórico e filtragem direta por unidade.

---

### 1. Migração SQL — Criar tabela `aulas_inaugurais`

```sql
CREATE TABLE public.aulas_inaugurais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Vínculos
  aluno_id uuid REFERENCES public.alunos(id) ON DELETE SET NULL,
  atividade_pos_venda_id uuid REFERENCES public.atividade_pos_venda(id) ON DELETE SET NULL,
  evento_professor_id uuid REFERENCES public.eventos_professor(id) ON DELETE SET NULL,
  client_id uuid NOT NULL,
  unit_id uuid NOT NULL REFERENCES public.units(id),
  professor_id uuid REFERENCES public.professores(id) ON DELETE SET NULL,
  sala_id uuid REFERENCES public.salas(id) ON DELETE SET NULL,
  
  -- Agendamento
  data date NOT NULL,
  horario_inicio time NOT NULL,
  horario_fim time NOT NULL,
  
  -- Status
  status text NOT NULL DEFAULT 'agendada',  -- agendada | realizada | cancelada | reagendada
  
  -- Dados pedagógicos (preenchidos após a aula)
  percepcao_coordenador text,
  motivo_procura text,
  avaliacao_abaco text,
  avaliacao_ah text,
  pontos_atencao text,
  coordenador_responsavel text,
  
  -- Metadados
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.aulas_inaugurais ENABLE ROW LEVEL SECURITY;

-- Policy: leitura por unidade
CREATE POLICY "users_read_own_unit"
  ON public.aulas_inaugurais FOR SELECT TO authenticated
  USING (public.user_has_access_to_unit(unit_id));

-- Policy: insert por unidade
CREATE POLICY "users_insert_own_unit"
  ON public.aulas_inaugurais FOR INSERT TO authenticated
  WITH CHECK (public.user_has_access_to_unit(unit_id));

-- Policy: update por unidade
CREATE POLICY "users_update_own_unit"
  ON public.aulas_inaugurais FOR UPDATE TO authenticated
  USING (public.user_has_access_to_unit(unit_id));

-- Policy: delete por unidade
CREATE POLICY "users_delete_own_unit"
  ON public.aulas_inaugurais FOR DELETE TO authenticated
  USING (public.user_has_access_to_unit(unit_id));

-- Trigger updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.aulas_inaugurais
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

### 2. Migração de dados existentes

Migrar os 4 registros atuais de `eventos_professor` (tipo_evento = 'aula_zero') para a nova tabela, cruzando com `atividade_pos_venda` para trazer dados pedagógicos e `unit_id`:

```sql
INSERT INTO public.aulas_inaugurais (
  evento_professor_id, atividade_pos_venda_id, client_id, unit_id,
  professor_id, data, horario_inicio, horario_fim,
  percepcao_coordenador, motivo_procura, avaliacao_abaco, avaliacao_ah, pontos_atencao,
  created_by, created_at
)
SELECT
  ep.id,
  ep.atividade_pos_venda_id,
  COALESCE(ep.client_id, apv.client_id),
  apv.unit_id,
  ep.professor_id,
  ep.data,
  ep.horario_inicio,
  ep.horario_fim,
  apv.percepcao_coordenador,
  apv.motivo_procura,
  apv.avaliacao_abaco,
  apv.avaliacao_ah,
  apv.pontos_atencao,
  ep.created_by,
  ep.created_at
FROM eventos_professor ep
LEFT JOIN atividade_pos_venda apv ON apv.id = ep.atividade_pos_venda_id
WHERE ep.tipo_evento = 'aula_zero'
  AND apv.unit_id IS NOT NULL;
```

### 3. Atualizar hook de listagem

**Arquivo:** `src/hooks/use-aulas-inaugurais-professor.ts`
- Substituir queries em `eventos_professor` + `atividade_pos_venda` por query direta na tabela `aulas_inaugurais`
- Filtrar por `unit_id` diretamente (sem JOIN indireto)
- Manter lógica de "concluída" baseada nos campos pedagógicos preenchidos

### 4. Atualizar drawer de lançamento

**Arquivo:** `src/components/aula-zero/AulaZeroDrawer.tsx`
- Ler/gravar dados pedagógicos na tabela `aulas_inaugurais` (por `atividade_pos_venda_id` ou pelo novo `id`)
- Manter sincronização com `alunos` (update nos mesmos campos)
- Atualizar status para `realizada` ao salvar os dados pedagógicos

### 5. Atualizar agendamento no painel administrativo

**Arquivo:** `src/components/painel-administrativo/DadosFinaisForm.tsx`
- Ao agendar aula inaugural, além de criar em `eventos_professor`, criar registro em `aulas_inaugurais`
- Ao reagendar, atualizar o registro existente (ou criar novo com status `reagendada`)
- Vincular `sala_id` se disponível

### 6. Atualizar Home (cards de eventos)

**Arquivo:** `src/pages/Home.tsx`
- O hook `useAulasInauguraisProfessor` já alimenta os cards; com a mudança do hook (passo 3), os cards funcionarão automaticamente
- Garantir que o `id` da aula inaugural seja passado para o drawer

### 7. Atualizar webhook

**Arquivo referência:** `supabase/functions/webhook-aula-inaugural`
- Incluir `aula_inaugural_id` no payload do webhook para rastreabilidade

---

### Arquivos impactados (resumo)

| Arquivo | Ação |
|---|---|
| Migração SQL (nova) | Criar tabela + RLS + migrar dados |
| `use-aulas-inaugurais-professor.ts` | Reescrever queries para nova tabela |
| `AulaZeroDrawer.tsx` | Gravar na nova tabela + sincronizar alunos |
| `DadosFinaisForm.tsx` | Criar registro na nova tabela ao agendar |
| `Home.tsx` | Ajustes mínimos (passa a usar novo ID) |
| `webhook-aula-inaugural` | Adicionar `aula_inaugural_id` ao payload |

### Observações
- Os dados em `atividade_pos_venda` (campos pedagógicos) e `eventos_professor` (tipo aula_zero) continuam existindo, mas passam a ser secundários — a fonte de verdade será `aulas_inaugurais`
- Campos pedagógicos em `atividade_pos_venda` podem ser mantidos temporariamente para retrocompatibilidade, mas no futuro podem ser removidos




## Extrair horário do nome da turma durante a sincronização

### Problema
As turmas são criadas/atualizadas sem `horario_inicio` e `horario_fim`, mesmo tendo o horário no nome (ex: `"5ª (10:00 60+)"`, `"4ª (16:00 - Adultos)"`). Sem esses campos, o calendário não consegue posicionar as turmas no grid.

### Solução
Adicionar extração de horário via regex na Edge Function `sync-turmas-xls`, na Etapa 3 (Processar Turmas), logo após a extração do dia da semana.

### Padrão dos nomes
Exemplos reais da base:
- `5ª (10:00 60+)`
- `4ª (16:00 - Adultos)`
- `2ª (16:00 - 60+)`
- `5ª (14:00 - Júnior)`
- `Sábado (10:00 - Júnior)`
- `5ª (09:01 - Adolescente)`

O horário sempre aparece entre parênteses no formato `HH:MM`.

### Detalhes técnicos

**Arquivo:** `supabase/functions/sync-turmas-xls/index.ts`

Após a extração do `diaSemana` (linha ~254), adicionar:

```typescript
// Extrair horário do nome da turma (ex: "5ª (10:00 60+)" -> "10:00")
let horarioInicio: string | null = null;
let horarioFim: string | null = null;
const horarioMatch = nome.match(/\((\d{1,2}:\d{2})/);
if (horarioMatch) {
  horarioInicio = horarioMatch[1];
  // Calcular horário fim como +1 hora
  const [horas, minutos] = horarioInicio.split(':').map(Number);
  const fimHoras = horas + 1;
  horarioFim = `${String(fimHoras).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
}
```

Depois, incluir `horario_inicio` e `horario_fim` nos objetos de `update` e `insert` da turma:

```typescript
// No update (turma existente):
.update({
  professor_id: professor.id,
  dia_semana: diaSemana,
  horario_inicio: horarioInicio,
  horario_fim: horarioFim,
  sala: turmaData.sala || null,
  active: true,
  ultima_sincronizacao: new Date().toISOString()
})

// No insert (turma nova):
.insert({
  nome,
  professor_id: professor.id,
  dia_semana: diaSemana,
  horario_inicio: horarioInicio,
  horario_fim: horarioFim,
  sala: turmaData.sala || null,
  unit_id: unitId,
  active: true,
  ultima_sincronizacao: new Date().toISOString()
})
```

### Sobre a sala (sala_id)
As turmas de Londrina continuarão sem `sala_id`. O calendário precisará de um ajuste separado para exibir turmas sem sala definida (possivelmente em uma seção "Turmas sem sala"). Esse ajuste **não faz parte deste plano** — aqui o foco é garantir que o horário seja preenchido automaticamente.

### Resultado esperado
Após re-sincronizar o XLS de Londrina, as turmas terão `horario_inicio` e `horario_fim` preenchidos automaticamente a partir do nome.

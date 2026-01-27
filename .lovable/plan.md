
# Plano: Agendamento de Aula Inaugural com Verificacao de Disponibilidade

## Resumo

Implementar a logica de agendamento de aula inaugural que verifica automaticamente a disponibilidade de **salas** e **professores**, selecionando o primeiro professor disponivel por ordem de prioridade.

## Fluxo do Usuario

1. Usuario seleciona uma **data** no calendario
2. Sistema carrega os **horarios disponiveis** (slots de 30 min ou 1 hora)
3. Usuario seleciona um **horario de inicio**
4. Sistema verifica:
   - Salas disponiveis naquele horario
   - Professores disponiveis ordenados por prioridade
5. Sistema exibe o **professor selecionado automaticamente** e a **sala disponivel**
6. Usuario confirma e salva os dados pedagogicos

## Detalhes Tecnicos

### 1. Criar Funcao RPC no Supabase

Criar uma funcao `get_professores_disponiveis_por_horario` que:
- Recebe: data, horario_inicio, horario_fim, unit_id
- Retorna: lista de professores disponiveis ordenados por prioridade

A logica verifica conflitos com:
- **Turmas regulares**: professores que tem aula naquele dia da semana e horario
- **Eventos pontuais**: eventos na tabela `eventos_professor` para a data especifica
- **Eventos recorrentes**: bloqueios semanais recorrentes

```text
+-------------------+
|   Data + Horario  |
+-------------------+
          |
          v
+-------------------+     +-------------------+
| Verificar Turmas  | --> | Verificar Eventos |
| (dia_semana)      |     | (data especifica) |
+-------------------+     +-------------------+
          |                        |
          +----------+-------------+
                     |
                     v
        +-------------------------+
        | Professores Disponiveis |
        | ORDER BY prioridade ASC |
        +-------------------------+
```

### 2. Criar Hook `use-professores-disponiveis`

Hook React Query que:
- Chama a funcao RPC criada
- Recebe data, horario_inicio e duracao
- Retorna lista de professores disponiveis com prioridade

### 3. Atualizar o Formulario `DadosPedagogicosForm`

Modificar a secao "Aula Inaugural" para incluir:

**Etapa 1 - Selecao de Data:**
- Calendario para escolher a data
- Ao selecionar, carrega horarios disponiveis

**Etapa 2 - Selecao de Horario:**
- Dropdown com horarios disponiveis (usa hook `useHorariosDisponiveisSalas`)
- Duracao fixa de 1 hora para aula inaugural

**Etapa 3 - Confirmacao Automatica:**
- Exibe o professor selecionado automaticamente (primeiro por prioridade)
- Exibe a sala selecionada automaticamente (primeira disponivel)
- Permite ao usuario confirmar ou escolher outra opcao

### 4. Atualizar Hook de Salvamento

Criar/atualizar hook para salvar os dados pedagogicos na tabela `atividade_pos_venda`:
- `turma_id` - turma selecionada
- `responsavel` - responsavel pedagogico
- `whatsapp_contato` - telefone do responsavel
- `data_aula_inaugural` - data da aula

Alem disso, criar evento na tabela `eventos_professor` para bloquear o horario do professor.

### 5. Estrutura dos Arquivos

```text
src/
  hooks/
    use-professores-disponiveis.ts  (novo)
    use-salvar-dados-pedagogicos.ts (novo)
  components/
    painel-administrativo/
      DadosPedagogicosForm.tsx (atualizar)
      AulaInauguralSelector.tsx (novo - componente dedicado)
      
supabase/
  migrations/
    XXXXXX_professores_disponiveis.sql (nova funcao RPC)
```

### 6. Layout do Componente de Aula Inaugural

O accordion "Aula Inaugural" tera o seguinte layout:

```text
+------------------------------------------+
| Aula Inaugural                       [-] |
+------------------------------------------+
| Data da Aula                             |
| [Calendario]                             |
|                                          |
| Horario (se data selecionada)            |
| [Dropdown com horarios disponiveis]      |
|                                          |
| Resultado (se horario selecionado)       |
| +--------------------------------------+ |
| | Professor: Andre do Valle (prio. 1)  | |
| | Sala: Sala 1 - Azul                  | |
| | Data: 28/01/2026 as 09:00            | |
| +--------------------------------------+ |
+------------------------------------------+
```

## Consideracoes

- A duracao da aula inaugural sera **fixa em 1 hora** (60 minutos)
- O professor e selecionado automaticamente baseado na **prioridade** (coluna `prioridade` na tabela `professores`)
- Se nao houver professor disponivel, exibir mensagem informativa
- O horario sera bloqueado na agenda do professor ao salvar
- A unidade sera sempre **Maringa** (conforme padrao do projeto)

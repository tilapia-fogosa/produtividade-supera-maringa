
# Plano: Unificar Etapas 2 e 3 do Modal de Bloquear Horário

## Objetivo
Mesclar a etapa 2 (Data/Horário/Duração) com a etapa 3 (Tipo de Evento/Título/Descrição) em uma única etapa, com layout lado a lado.

## Estrutura Atual
- **Etapa 1**: Seleção de professores + tipo de bloqueio (pontual/periódico)
- **Etapa 2**: Calendário/dia da semana + horário + duração
- **Etapa 3**: Tipo de evento + título + descrição + resumo

## Nova Estrutura Proposta
- **Etapa 1**: Seleção de professores + tipo de bloqueio (mantém igual)
- **Etapa 2**: Layout em duas colunas:
  - **Coluna Esquerda**: Calendário (pontual) ou Dia da semana + calendários de recorrência (periódico), horário e duração
  - **Coluna Direita**: Tipo de evento, título, descrição e resumo

## Layout Visual da Nova Etapa 2

```text
+------------------------------------------+
|  Bloquear Horário - Etapa 2/2            |
+------------------------------------------+
|                                          |
| +------------------+  +----------------+ |
| | CALENDÁRIO/DIA   |  | Tipo Evento    | |
| |                  |  | [Select    v]  | |
| | [  Calendário  ] |  |                | |
| |                  |  | Título         | |
| | Horário  Duração |  | [Input       ] | |
| | [Select] [Select]|  |                | |
| |                  |  | Descrição      | |
| | 10:00 - 11:00    |  | [Textarea    ] | |
| +------------------+  +----------------+ |
|                                          |
| +--------------------------------------+ |
| | RESUMO                               | |
| | Professores: João, Maria             | |
| | Tipo: Pontual | Data: 27/01/2026     | |
| | Horário: 10:00 - 11:00               | |
| +--------------------------------------+ |
|                                          |
| [Voltar]                   [Salvar]      |
+------------------------------------------+
```

## Alterações Técnicas

### 1. Atualizar Contador de Etapas
- Alterar título de "Etapa {etapa}/3" para "Etapa {etapa}/2"

### 2. Remover Navegação para Etapa 3
- Botão "Próximo" da etapa 2 se torna "Salvar Bloqueio"
- Remover lógica de `etapa === 3`

### 3. Unificar Layout da Etapa 2
- Criar grid com 2 colunas (`grid grid-cols-2 gap-6`)
- Coluna esquerda: conteúdo atual da etapa 2
- Coluna direita: conteúdo atual da etapa 3 (tipo, título, descrição)
- Resumo abaixo das duas colunas (full width)

### 4. Ajustar Validação do Botão Salvar
- Mover validação atual do botão salvar para a nova etapa 2
- Validar: data/dia + horário + tipoEvento + titulo

## Arquivo Modificado
- `src/components/professores/BloquearHorarioProfessorModal.tsx`

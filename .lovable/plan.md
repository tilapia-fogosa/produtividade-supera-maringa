

## Plano: Vincular aluno à atividade_pos_venda (em vez de client)

### Contexto
Atualmente, o vínculo entre aluno e a atividade de pós-venda é feito indiretamente pelo campo `client_id` na tabela `alunos`. Isso gera problemas quando um mesmo cliente tem múltiplas matrículas. A mudança fará o vínculo direto via `atividade_pos_venda_id`.

### 1. Migração no banco de dados
- Adicionar coluna `atividade_pos_venda_id` (uuid, nullable, FK para `atividade_pos_venda.id`) na tabela `alunos`
- Migrar dados existentes: popular `atividade_pos_venda_id` com base nos `client_id` já vinculados (buscar a atividade correspondente)

### 2. Hook `use-alunos-sem-vinculo.ts`
- **`useAlunosSemVinculo`**: Alterar filtro de `client_id === null` para `atividade_pos_venda_id === null`, receber `currentAtividadeId` em vez de `currentClientId`
- **`useAlunoVinculado`**: Buscar por `atividade_pos_venda_id` em vez de `client_id`

### 3. `DadosFinaisForm.tsx` (lógica de vínculo)
- Ao vincular aluno: gravar `atividade_pos_venda_id` (e manter `client_id` por compatibilidade)
- Ao desvincular: limpar `atividade_pos_venda_id` do aluno anterior
- Atualizar chamadas dos hooks para passar `cliente.atividade_pos_venda_id`

### 4. Hook `use-atividades-pos-venda.ts`
- Alterar verificação de aluno vinculado: buscar alunos por `atividade_pos_venda_id` das atividades (em vez de `client_id`)

### 5. Outros arquivos impactados
- `DadosPedagogicosForm.tsx` e `DadosCadastraisForm.tsx`: atualizar chamadas de `useAlunoVinculado` para usar `atividade_pos_venda_id`
- Manter `client_id` nos alunos como campo secundário (não remover) para compatibilidade com outras partes do sistema


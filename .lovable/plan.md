

## Plano: Exibir nome do professor em vez do ID na coluna "Professor Correção"

### Problema
O campo `professor_correcao` armazena UUIDs de professores, mas a tabela exibe o ID bruto ao invés do nome.

### Alterações

**1. `src/hooks/use-diarios-sao-rafael.ts`**
- Após buscar os dados de AH, coletar os IDs únicos de `professor_correcao`
- Fazer uma query na tabela `professores` para buscar os nomes correspondentes
- Retornar um mapa `professorMap: Record<string, string>` (id → nome) junto com os demais dados

**2. `src/pages/DiariosSaoRafael.tsx`**
- Receber `professorMap` do hook
- Na linha de exibição (linha 506), substituir `item.professor_correcao` por `professorMap[item.professor_correcao] || item.professor_correcao || '-'`
- No modo edição (linha 472), trocar o Input de texto por um Select com os professores disponíveis, mantendo o valor como ID


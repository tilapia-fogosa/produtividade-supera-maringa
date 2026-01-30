

## Plano: Adicionar Accordion de Reposições na Página de Diário

### Contexto do Problema
Atualmente, quando um aluno faz reposição de aula em uma turma diferente da sua, o registro de produtividade (`produtividade_abaco` com `is_reposicao = true`) fica "escondido" porque:
1. O diário só mostra turmas que têm aulas no dia selecionado
2. Os registros de reposição são de alunos que pertencem a outras turmas

### Solução Proposta
Adicionar um accordion especial chamado **"Reposições"** após todas as turmas regulares. Este accordion irá mostrar todos os registros de `produtividade_abaco` onde `is_reposicao = true` para a data selecionada, incluindo informações sobre o aluno e sua turma original.

---

### Componentes a Modificar

#### 1. Página Diario.tsx
- Adicionar busca de reposições do dia (registros onde `is_reposicao = true`)
- Passar dados de reposições para um novo componente

#### 2. DiarioTurmaAccordion.tsx
- Adicionar prop opcional para receber reposições
- Renderizar accordion extra "Reposições" após as turmas

#### 3. Novo Componente: DiarioReposicoesTabela.tsx (opcional)
- Versão adaptada do DiarioTabela que mostra a coluna "Turma Original"
- Ou: adicionar prop ao DiarioTabela para mostrar coluna extra de turma

---

### Detalhes Técnicos

#### Query para Buscar Reposições do Dia
```sql
SELECT 
  pa.*,
  COALESCE(a.nome, f.nome) as pessoa_nome,
  COALESCE(a.foto_url, f.foto_url) as pessoa_foto,
  COALESCE(a.turma_id, f.turma_id) as turma_original_id,
  t.nome as turma_original_nome
FROM produtividade_abaco pa
LEFT JOIN alunos a ON pa.pessoa_id = a.id
LEFT JOIN funcionarios f ON pa.pessoa_id = f.id
LEFT JOIN turmas t ON COALESCE(a.turma_id, f.turma_id) = t.id
WHERE pa.is_reposicao = true
  AND pa.data_aula = '2026-01-30'
ORDER BY pa.created_at DESC
```

#### Estrutura do Accordion de Reposições
- Título: "Reposições" com ícone de refresh/swap
- Badge mostrando quantidade de registros
- Tabela similar à DiarioTabela, mas com coluna adicional "Turma Original"

---

### Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `src/pages/Diario.tsx` | Adicionar busca de reposições e passar para accordion |
| `src/components/diario/DiarioTurmaAccordion.tsx` | Adicionar accordion de reposições no final |
| `src/components/diario/DiarioReposicoesTabela.tsx` | **Criar** - Tabela específica para reposições com coluna de turma original |

---

### Fluxo de Implementação

1. **Criar DiarioReposicoesTabela.tsx**
   - Baseado no DiarioTabela
   - Adicionar coluna "Turma Original" após o nome
   - Remover botão "Novo Registro" (não faz sentido criar reposição manualmente aqui)

2. **Modificar Diario.tsx**
   - Adicionar estado para reposições do dia
   - Buscar registros onde `is_reposicao = true` quando a data mudar
   - Passar reposições para DiarioTurmaAccordion

3. **Modificar DiarioTurmaAccordion.tsx**
   - Receber prop `reposicoesData` opcional
   - Após renderizar todas as turmas, adicionar AccordionItem "Reposições"
   - Usar DiarioReposicoesTabela para exibir os dados

---

### Exemplo Visual

```
Turmas de Sexta-feira
├── 6ª (08:00 - 60+)           [3 registros]
├── 6ª (10:00 - Júnior)        [4 registros]  
├── 6ª (14:00 - Mirim)         [5 registros]
├── 6ª (16:00 - Adultos)       [2 registros]
└── Reposições                 [3 registros]  ← NOVO
    ├── João Angelo Mesti      | Turma: 3ª (14:00 - Júnior) | Presente | ...
    ├── Maria Silva            | Turma: Sábado (08:00)      | Presente | ...
    └── Pedro Santos           | Turma: 4ª (16:00 - Adultos)| Ausente  | ...
```

---

### Considerações

1. **Lazy Loading**: Carregar reposições apenas quando o accordion for expandido (seguindo padrão existente)
2. **Evitar Duplicatas**: Reposições já aparecem no accordion de reposições, não devem aparecer nas turmas regulares
3. **Edição/Exclusão**: Permitir editar e excluir registros de reposição normalmente


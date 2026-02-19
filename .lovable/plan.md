
# Enviar professor_id no webhook da Aula Zero

## O que muda

No arquivo `src/components/aula-zero/AulaZeroDrawer.tsx`:

1. Substituir `useCurrentFuncionario` por `useAuth` (que ja tem `profile.professor_id` e `profile.full_name`)
2. No payload do webhook, adicionar o campo `professor_id` vindo de `profile.professor_id`
3. Usar `profile.full_name` como valor de `registrado_por` (resolve tambem o problema do campo vazio)
4. No campo `coordenador_responsavel` da tabela `alunos`, usar `profile.full_name` como fallback

## Detalhes Tecnicos

**Arquivo:** `src/components/aula-zero/AulaZeroDrawer.tsx`

- Remover import de `useCurrentFuncionario`
- Importar `useAuth` de `@/contexts/AuthContext`
- Extrair `profile` do hook `useAuth`
- No payload do webhook: `professor_id: profile?.professor_id || null`
- No campo `registrado_por`: `profile?.full_name || profile?.email || 'Desconhecido'`
- No `coordenador_responsavel` da tabela alunos: `profile?.full_name || undefined`

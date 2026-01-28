
# Plano: Adicionar Indicador "Falta no Mes" na Tela de Sala/Turma

## Resumo

Adicionar um novo indicador visual que mostra se o aluno teve alguma falta durante o mes atual. Este indicador aparecera junto com o aviso de faltas consecutivas existente.

---

## Arquitetura da Solucao

### Dados Necessarios

A informacao de faltas esta na tabela `produtividade_abaco`:
- Campo `presente = false` indica falta
- Campo `data_aula` para filtrar pelo mes atual

### Query para Buscar Faltas do Mes

```sql
SELECT pessoa_id, COUNT(*) as total_faltas
FROM produtividade_abaco
WHERE pessoa_id IN (lista_de_alunos)
  AND presente = false
  AND data_aula >= inicio_do_mes
  AND data_aula <= hoje
GROUP BY pessoa_id
```

---

## Alteracoes Necessarias

### 1. Hook `use-lembretes-alunos.ts`

Adicionar nova propriedade na interface:

```typescript
export interface LembretesAluno {
  // ... campos existentes
  faltouNoMes: boolean;
  faltasNoMes?: number; // quantidade de faltas
}
```

Adicionar query para buscar faltas do mes:

```typescript
// Buscar faltas do mes atual
const inicioMes = startOfMonth(hoje);
const { data: faltasData } = await supabase
  .from('produtividade_abaco')
  .select('pessoa_id')
  .in('pessoa_id', alunoIds)
  .eq('presente', false)
  .gte('data_aula', format(inicioMes, 'yyyy-MM-dd'))
  .lte('data_aula', format(hoje, 'yyyy-MM-dd'));

// Contar faltas por aluno
const faltasPorAluno = new Map<string, number>();
faltasData?.forEach(f => {
  const count = faltasPorAluno.get(f.pessoa_id) || 0;
  faltasPorAluno.set(f.pessoa_id, count + 1);
});
```

### 2. Componente `SalaAlunosListaTable.tsx`

Atualizar a verificacao de lembretes para incluir `faltouNoMes`:

```typescript
const temLembretes = alunoLembretes && (
  alunoLembretes.aniversarioHoje || 
  alunoLembretes.aniversarioSemana ||
  alunoLembretes.camisetaPendente || 
  alunoLembretes.apostilaAHPronta ||
  alunoLembretes.botomPendente ||
  alunoLembretes.faltouNoMes  // NOVO
);
```

Adicionar exibicao visual do lembrete:

```tsx
{alunoLembretes.faltouNoMes && (
  <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
    <Calendar className="h-4 w-4 shrink-0" />
    <span>
      {alunoLembretes.faltasNoMes} falta{alunoLembretes.faltasNoMes! > 1 ? 's' : ''} no mes
    </span>
  </div>
)}
```

---

## Layout Visual

O indicador aparecera na caixa de lembretes do card do aluno, junto com os outros avisos:

```text
+----------------------------------+
| Card do Aluno                    |
|                                  |
| [Foto] Nome do Aluno            |
|        Apostila: Abaco 5        |
|        Pagina: 32 de 50         |
|        ⚠ 2 faltas consecutivas  |  <-- Existente
|                                  |
|        +-------------------+     |
|        | 🎂 Aniversario!   |     |
|        | 📅 2 faltas mes   |     |  <-- NOVO
|        | 👕 Entregar camis.|     |
|        +-------------------+     |
+----------------------------------+
```

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/sala/use-lembretes-alunos.ts` | Adicionar propriedade `faltouNoMes` e `faltasNoMes`, adicionar query para buscar faltas do mes |
| `src/components/sala/SalaAlunosListaTable.tsx` | Exibir lembrete visual de faltas no mes na caixa de lembretes |

---

## Regra de Negocio

- O indicador aparece se o aluno teve **pelo menos 1 falta** no mes atual
- Exibe a quantidade de faltas: "1 falta no mes" ou "2 faltas no mes"
- Cor vermelha/laranja para destacar o aviso
- O indicador e apenas informativo (nao clicavel)

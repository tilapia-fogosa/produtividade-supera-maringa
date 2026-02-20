
# Reorganizar layout do drawer de atividades - Separar realizadas de pendentes

## Objetivo
Reorganizar a lista de atividades no `AtividadesDrawer` em duas secoes visuais separadas, com o alerta criado como primeiro item.

## Mudancas

### Arquivo: `src/components/alerta-evasao/AtividadesDrawer.tsx`

**1. Adicionar card do "Alerta Criado" no topo**
- Antes de qualquer atividade, renderizar um card com badge "Alerta Criado" (usando a cor da origem do alerta, ex: bg-amber-500)
- Exibir o `alerta.descritivo` como conteudo do card
- Exibir a data de criacao do alerta e a origem
- Visual identico aos cards de atividade (mesma estrutura), mas com opacity-70 (ja realizado)
- Incluir o icone de Check verde como nas atividades concluidas

**2. Separar atividades em duas secoes**
- Calcular `atividadesRealizadas` = atividades com `status === 'concluida'`
- Calcular `atividadesPendentes` = atividades com `status === 'pendente'`
- Renderizar na seguinte ordem:
  1. Card "Alerta Criado" (descritivo do alerta)
  2. Cards das atividades realizadas (concluidas)
  3. Separador visual (Separator com label "Pendentes" ou "Proximas etapas")
  4. Cards das atividades pendentes
- Se nao houver pendentes, nao exibir o separador

**3. Separador visual**
- Usar um divisor horizontal com texto centralizado "Pendentes" ou "Proximas etapas"
- Estilo: linha com texto no meio, cor muted, texto pequeno (text-xs)

## Detalhes tecnicos

### Logica de separacao
```text
const atividadesRealizadas = atividades.filter(a => a.status === 'concluida');
const atividadesPendentes = atividades.filter(a => a.status === 'pendente');
```

### Card do alerta criado
```text
<Card className="overflow-hidden opacity-70">
  <div className="h-1 bg-amber-500" />
  <CardContent className="p-2 space-y-1">
    <div className="flex items-center justify-between gap-1">
      <div className="flex items-center gap-1">
        <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0">
          Alerta Criado
        </Badge>
        <Check className="h-3 w-3 text-green-600" />
      </div>
      <span className="text-[10px] text-muted-foreground">
        {formatarData(alerta.data_alerta)}
      </span>
    </div>
    <p className="text-xs leading-tight">{alerta.descritivo || 'Sem descritivo'}</p>
    <span className="text-[10px] text-muted-foreground">
      Origem: {getOrigemLabel(alerta.origem_alerta)}
    </span>
  </CardContent>
</Card>
```

### Separador entre secoes
```text
<div className="flex items-center gap-2 py-2">
  <div className="flex-1 h-px bg-border" />
  <span className="text-[10px] text-muted-foreground font-medium">Proximas etapas</span>
  <div className="flex-1 h-px bg-border" />
</div>
```

### Funcao auxiliar getOrigemLabel
Importar ou replicar a funcao `getOrigemLabel` que ja existe em `AlertasEvasao.tsx` para exibir o label amigavel da origem do alerta no card.

## O que NAO muda
- Toda a logica de expansao, paineis laterais e interacao com atividades permanece identica
- O codigo dos cards de atividade existente nao muda, apenas a ordem de renderizacao
- Nenhuma mudanca no hook ou no backend

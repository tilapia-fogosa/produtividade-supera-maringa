# Padrão de Expansão de Gavetas (Drawer)

## Regra Geral

Quando uma gaveta (drawer/sheet) precisar exibir informações adicionais ou painéis de ação, ela deve **expandir sua largura** ao invés de abrir modais separados.

## Comportamento

### Estado Normal
- Largura compacta: `max-w-sm` (~384px)
- Exibe conteúdo principal (histórico, lista, detalhes)

### Estado Expandido
- Largura expandida: `max-w-2xl` (~672px) ou maior conforme necessidade
- Layout de duas colunas:
  - **Coluna Esquerda**: Conteúdo original (histórico, lista)
  - **Coluna Direita**: Painel de ação/seleção contextual

## Estilização Desktop

Como este é um projeto desktop-first, todos os elementos devem seguir alta densidade:

### Tipografia
- Títulos de seção: `text-xs font-medium`
- Labels e textos: `text-[10px]` ou `text-[11px]`
- Badges: `text-[9px]` ou `text-[10px]`

### Botões
- Altura compacta: `h-6` ou `h-7`
- Padding reduzido: `px-2` ou `px-3`
- Font size: `text-[10px]` ou `text-xs`

### Espaçamento
- Gap entre elementos: `gap-1` ou `gap-2`
- Padding de containers: `p-2` ou `p-3`
- Margin entre seções: `space-y-2` ou `space-y-3`

### Cards e Containers
- Padding interno: `p-2` ou `p-3`
- Border radius: `rounded` ou `rounded-md`
- Separadores visuais com `border` ao invés de espaçamento excessivo

## Exemplo de Implementação

```tsx
<SheetContent 
  className={cn(
    "flex flex-col transition-all duration-300",
    isExpanded ? "sm:max-w-2xl" : "sm:max-w-sm"
  )}
>
  <div className={cn(
    "flex-1 overflow-hidden",
    isExpanded ? "grid grid-cols-2 gap-3" : ""
  )}>
    {/* Coluna Principal */}
    <div className="flex flex-col overflow-hidden">
      {/* Conteúdo original */}
    </div>
    
    {/* Painel de Ação (só aparece quando expandido) */}
    {isExpanded && (
      <div className="border-l pl-3 flex flex-col">
        {/* Opções de ação */}
      </div>
    )}
  </div>
</SheetContent>
```

## Quando Aplicar

- ✅ Seleção de resultado/outcome após ação
- ✅ Formulários de edição inline
- ✅ Painéis de configuração contextual
- ✅ Visualização de detalhes adicionais

## Quando NÃO Aplicar

- ❌ Confirmações simples (usar AlertDialog)
- ❌ Mensagens de erro/sucesso (usar toast)
- ❌ Ações destrutivas que requerem confirmação explícita

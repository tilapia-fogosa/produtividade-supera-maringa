
## Modal de Parabens com Efeito Confetti (Cannon)

### Objetivo
Quando a pagina de comissao for aberta e a meta de faturamento do mes atual estiver batida (totalFaturamento >= metaFaturamento), exibir um modal de parabens com efeito de confetti tipo "cannon" disparando do centro do modal para cima.

### Alteracoes

**1. Novo arquivo: `src/components/comissao/MetaBatidaModal.tsx`**

- Componente Dialog que recebe `open` e `onClose` como props
- Conteudo visual com titulo "Parabens!", mensagem de congratulacoes e o valor atingido
- Efeito de confetti usando Framer Motion, simulando particulas disparando do centro-inferior do modal para cima (cannon effect)
- As particulas terao cores variadas, tamanhos aleatorios e trajetorias com gravidade (sobem e depois caem)
- Botao para fechar o modal

**2. Arquivo: `src/pages/Comissao.tsx`**

- Adicionar estado `showMetaModal` controlado por `useState`
- Adicionar `useEffect` que verifica se `metaFaturamento > 0` e `totalContrato >= metaFaturamento`
- Usar `sessionStorage` para evitar que o modal abra toda vez que o componente re-renderizar (salvar chave `comissao-meta-batida-{mes}-{ano}`)
- Renderizar o `MetaBatidaModal` passando `open` e `onClose`

### Detalhes do Efeito Cannon

O efeito sera feito com Framer Motion (ja instalado no projeto). Serao geradas ~30 particulas com:
- Ponto de origem: centro-inferior do modal
- Direcao: para cima com dispersao lateral aleatoria
- Cada particula tera: cor aleatoria, tamanho aleatorio (4-8px), rotacao, e animacao com `y` negativo (sobe) seguido de `y` positivo (cai com gravidade)
- Duracao: ~2 segundos com easing personalizado

### Comportamento
- O modal so aparece uma vez por sessao por combinacao mes/ano
- So dispara quando ha meta configurada e ela foi batida
- O usuario fecha o modal clicando no botao ou no X

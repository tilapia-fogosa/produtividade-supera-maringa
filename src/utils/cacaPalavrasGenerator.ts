// Direções possíveis para colocar palavras
const DIRECTIONS = [
  { dx: 0, dy: 1 },   // Horizontal (direita)
  { dx: 1, dy: 0 },   // Vertical (baixo)
  { dx: 1, dy: 1 },   // Diagonal (baixo-direita)
  { dx: 1, dy: -1 },  // Diagonal (baixo-esquerda)
  { dx: 0, dy: -1 },  // Horizontal (esquerda)
  { dx: -1, dy: 0 },  // Vertical (cima)
  { dx: -1, dy: -1 }, // Diagonal (cima-esquerda)
  { dx: -1, dy: 1 },  // Diagonal (cima-direita)
];

// Letras mais comuns em português para preencher espaços vazios
const LETRAS_PORTUGUESAS = 'AEIOURSTLNMCDPBFGVHJQXZWYK';

export function gerarCacaPalavras(palavras: string[], largura: number, altura: number): string[][] {
  // Inicializar grid vazio
  const grid: string[][] = Array(altura).fill(null).map(() => Array(largura).fill(''));
  
  // Tentar colocar cada palavra no grid
  const palavrasColocadas: string[] = [];
  
  for (const palavra of palavras) {
    let colocada = false;
    let tentativas = 0;
    const maxTentativas = 100;
    
    while (!colocada && tentativas < maxTentativas) {
      // Escolher posição e direção aleatórias
      const startX = Math.floor(Math.random() * altura);
      const startY = Math.floor(Math.random() * largura);
      const direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      
      // Verificar se a palavra cabe nesta posição e direção
      if (podeColocarPalavra(grid, palavra, startX, startY, direction, altura, largura)) {
        colocarPalavra(grid, palavra, startX, startY, direction);
        palavrasColocadas.push(palavra);
        colocada = true;
      }
      
      tentativas++;
    }
  }
  
  // Preencher espaços vazios com letras aleatórias
  preencherEspacosVazios(grid, altura, largura);
  
  return grid;
}

function podeColocarPalavra(
  grid: string[][],
  palavra: string,
  startX: number,
  startY: number,
  direction: { dx: number; dy: number },
  altura: number,
  largura: number
): boolean {
  for (let i = 0; i < palavra.length; i++) {
    const x = startX + i * direction.dx;
    const y = startY + i * direction.dy;
    
    // Verificar se está dentro dos limites
    if (x < 0 || x >= altura || y < 0 || y >= largura) {
      return false;
    }
    
    // Verificar se a posição está vazia ou tem a mesma letra
    if (grid[x][y] !== '' && grid[x][y] !== palavra[i]) {
      return false;
    }
  }
  
  return true;
}

function colocarPalavra(
  grid: string[][],
  palavra: string,
  startX: number,
  startY: number,
  direction: { dx: number; dy: number }
): void {
  for (let i = 0; i < palavra.length; i++) {
    const x = startX + i * direction.dx;
    const y = startY + i * direction.dy;
    grid[x][y] = palavra[i];
  }
}

function preencherEspacosVazios(grid: string[][], altura: number, largura: number): void {
  for (let i = 0; i < altura; i++) {
    for (let j = 0; j < largura; j++) {
      if (grid[i][j] === '') {
        // Escolher letra aleatória mais provável em português
        const indiceAleatorio = Math.floor(Math.random() * LETRAS_PORTUGUESAS.length);
        grid[i][j] = LETRAS_PORTUGUESAS[indiceAleatorio];
      }
    }
  }
}
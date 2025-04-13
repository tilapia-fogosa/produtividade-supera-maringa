
// Lista de apostilas de ábaco com número de páginas
export const APOSTILAS_ABACO_DETALHES = [
  { nome: "Infantil 1", paginas: 40 },
  { nome: "Infantil 2", paginas: 40 },
  { nome: "Júnior 1", paginas: 40 },
  { nome: "Júnior 2", paginas: 40 },
  { nome: "Júnior 3", paginas: 40 },
  { nome: "Júnior 4", paginas: 40 },
  { nome: "Júnior 5", paginas: 40 },
  { nome: "Sênior 1", paginas: 40 },
  { nome: "Sênior 2", paginas: 40 },
  { nome: "Sênior 3", paginas: 40 },
  { nome: "Sênior 4", paginas: 40 },
  { nome: "Sênior 5", paginas: 40 },
  { nome: "Básico 1", paginas: 40 },
  { nome: "Básico 2", paginas: 40 },
  { nome: "Intermediário 1", paginas: 40 },
  { nome: "Intermediário 2", paginas: 40 },
  { nome: "Intermediário 3", paginas: 40 },
  { nome: "Avançado 1", paginas: 40 },
  { nome: "Avançado 2", paginas: 40 },
  { nome: "Avançado 3", paginas: 40 },
  { nome: "Master 1", paginas: 40 },
  { nome: "Master 2", paginas: 40 },
  { nome: "Master 3", paginas: 40 },
  { nome: "Master 4", paginas: 40 },
  { nome: "A", paginas: 40 },
  { nome: "B", paginas: 40 },
  { nome: "C", paginas: 40 },
  { nome: "D", paginas: 40 },
  { nome: "Ábaco Girassol 1", paginas: 40 }
];

// Extrair apenas os nomes das apostilas para compatibilidade com código existente
export const APOSTILAS_ABACO = APOSTILAS_ABACO_DETALHES.map(apostila => apostila.nome);

// Lista de apostilas AH
export const APOSTILAS_AH = Array.from({ length: 11 }, (_, i) => `AH ${i + 1}`);

// Lista de professores (hardcoded for now)
export const PROFESSORES = [
  "Prof. Daniel",
  "Prof. Fernando",
  "Prof. Luana",
  "Prof. Mariana",
  "Estagiário João",
  "Estagiária Ana"
];

// Mapping entre os valores do banco de dados (ultimo_nivel) e as apostilas padronizadas
export const MAPEAMENTO_APOSTILAS: Record<string, string> = {
  // Mapeamentos exatos
  "Ap. Abaco 1": "Infantil 1",
  "Ap. Abaco 2": "Infantil 2",
  "Ap. Abaco B": "B",
  "Ap. Abaco 4": "Júnior 1",
  "Ap. Abaco 5": "Júnior 2",
  "Ábaco INT. 1": "Intermediário 1",
  "Ábaco INT. 2": "Intermediário 2",
  "Ábaco INT. 3": "Intermediário 3",
  
  // Mapeamentos aproximados (padrões para casos não mapeados)
  "A": "A",
  "B": "B",
  "C": "C",
  "D": "D",
  
  // Outros padrões comuns que podem aparecer
  "Básico": "Básico 1",
  "Intermediário": "Intermediário 1",
  "Avançado": "Avançado 1",
  "Júnior": "Júnior 1",
  "Sênior": "Sênior 1",
  "Master": "Master 1",
  "Girassol": "Ábaco Girassol 1"
};

export const getTotalPaginasPorApostila = (nomeApostila: string): number => {
  const apostila = APOSTILAS_ABACO_DETALHES.find(a => a.nome === nomeApostila);
  return apostila ? apostila.paginas : 40; // Valor padrão de 40 se não encontrar
};

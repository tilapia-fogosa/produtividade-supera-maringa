
// Lista de professores (hardcoded for now)
export const PROFESSORES = [
  "Prof. Daniel",
  "Prof. Fernando",
  "Prof. Luana",
  "Prof. Mariana",
  "Estagiário João",
  "Estagiária Ana"
];

// Lista de apostilas de ábaco
export const APOSTILAS_ABACO = [
  "Infantil 1",
  "Infantil 2",
  "Júnior 1",
  "Júnior 2", 
  "Júnior 3",
  "Júnior 4",
  "Júnior 5",
  "Sênior 1",
  "Sênior 2", 
  "Sênior 3",
  "Sênior 4",
  "Sênior 5",
  "Básico 1",
  "Básico 2",
  "Intermediário 1",
  "Intermediário 2", 
  "Intermediário 3",
  "Avançado 1",
  "Avançado 2", 
  "Avançado 3",
  "Master 1",
  "Master 2", 
  "Master 3",
  "Master 4",
  "A",
  "B", 
  "C",
  "D",
  "Ábaco Girassol 1"
];

// Lista de apostilas AH
export const APOSTILAS_AH = Array.from({ length: 11 }, (_, i) => `AH ${i + 1}`);

// Mapping entre os valores do banco de dados (ultimo_nivel) e as apostilas padronizadas
export const MAPEAMENTO_APOSTILAS = {
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

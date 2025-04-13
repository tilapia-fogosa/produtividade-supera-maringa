
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

export const getTotalPaginasPorApostila = (nomeApostila: string): number => {
  const apostila = APOSTILAS_ABACO_DETALHES.find(a => a.nome === nomeApostila);
  return apostila ? apostila.paginas : 40; // Valor padrão de 40 se não encontrar
};

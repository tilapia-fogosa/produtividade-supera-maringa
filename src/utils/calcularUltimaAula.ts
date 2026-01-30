/**
 * Calcula a data da última aula de uma turma baseado no dia da semana
 * 
 * Exemplo: Se hoje é Sexta-feira 30/01 e a turma tem aula na Quinta-feira,
 * a última aula foi ontem (29/01)
 */

const diasSemanaMap: Record<string, number> = {
  // Formato completo
  'Domingo': 0,
  'Segunda-feira': 1,
  'Terça-feira': 2,
  'Quarta-feira': 3,
  'Quinta-feira': 4,
  'Sexta-feira': 5,
  'Sábado': 6,
  // Formato abreviado (como pode vir do banco)
  'domingo': 0,
  'segunda': 1,
  'terca': 2,
  'terça': 2,
  'quarta': 3,
  'quinta': 4,
  'sexta': 5,
  'sabado': 6,
  'sábado': 6,
};

export function calcularUltimaAula(diaSemana: string | null | undefined): Date {
  const hoje = new Date();
  
  if (!diaSemana) {
    return hoje;
  }
  
  // Normalizar para lowercase para busca
  const diaLower = diaSemana.toLowerCase();
  
  // Tentar encontrar no mapa
  let diaTurma: number | undefined;
  
  for (const [key, value] of Object.entries(diasSemanaMap)) {
    if (key.toLowerCase() === diaLower || diaLower.includes(key.toLowerCase())) {
      diaTurma = value;
      break;
    }
  }
  
  if (diaTurma === undefined) {
    console.log('[calcularUltimaAula] Dia da semana não reconhecido:', diaSemana);
    return hoje;
  }
  
  const diaHoje = hoje.getDay(); // 0-6
  
  let diferenca = diaHoje - diaTurma;
  
  // Se a diferença for negativa, ajusta para a semana anterior
  if (diferenca < 0) {
    diferenca += 7;
  }
  
  const ultimaAula = new Date(hoje);
  ultimaAula.setDate(hoje.getDate() - diferenca);
  
  console.log('[calcularUltimaAula] Dia turma:', diaSemana, '| Hoje:', diaHoje, '| Dia turma index:', diaTurma, '| Diferença:', diferenca, '| Ultima aula:', ultimaAula.toISOString());
  
  return ultimaAula;
}

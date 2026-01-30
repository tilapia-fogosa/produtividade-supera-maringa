/**
 * Calcula a data da última aula de uma turma baseado no dia da semana
 * 
 * Exemplo: Se hoje é Sexta-feira 30/01 e a turma tem aula na Quinta-feira,
 * a última aula foi ontem (29/01)
 */

const diasSemanaMap: Record<string, number> = {
  'Domingo': 0,
  'Segunda-feira': 1,
  'Terça-feira': 2,
  'Quarta-feira': 3,
  'Quinta-feira': 4,
  'Sexta-feira': 5,
  'Sábado': 6,
};

export function calcularUltimaAula(diaSemana: string | null | undefined): Date {
  const hoje = new Date();
  
  if (!diaSemana || !(diaSemana in diasSemanaMap)) {
    return hoje;
  }
  
  const diaHoje = hoje.getDay(); // 0-6
  const diaTurma = diasSemanaMap[diaSemana];
  
  let diferenca = diaHoje - diaTurma;
  
  // Se a diferença for negativa, ajusta para a semana anterior
  if (diferenca < 0) {
    diferenca += 7;
  }
  
  const ultimaAula = new Date(hoje);
  ultimaAula.setDate(hoje.getDate() - diferenca);
  
  return ultimaAula;
}

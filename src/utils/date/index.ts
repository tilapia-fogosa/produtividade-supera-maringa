/**
 * Cria uma data segura a partir de ano e mês (1-indexed)
 */
export const createSafeDate = (year: number, month: number, day: number = 1): Date => {
  return new Date(year, month - 1, day);
};

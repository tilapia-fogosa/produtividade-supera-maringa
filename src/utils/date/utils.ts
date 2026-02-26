import { addDays, isWeekend, isSunday as dateFnsIsSunday, setHours, setMinutes } from 'date-fns';

export const isSunday = (date: Date): boolean => {
  return dateFnsIsSunday(date);
};

/**
 * Avança N dias úteis a partir de uma data
 */
export const advanceBusinessDays = (date: Date, days: number): Date => {
  let result = new Date(date);
  let remaining = days;
  
  while (remaining > 0) {
    result = addDays(result, 1);
    if (!isWeekend(result)) {
      remaining--;
    }
  }
  
  return result;
};

/**
 * Ajusta o horário para horário comercial (9h-18h)
 */
export const adjustToBusinessHours = (date: Date): Date => {
  let result = new Date(date);
  const hours = result.getHours();
  
  if (hours < 9) {
    result = setHours(setMinutes(result, 0), 9);
  } else if (hours >= 18) {
    result = advanceBusinessDays(result, 1);
    result = setHours(setMinutes(result, 0), 9);
  }
  
  // Se cair em fim de semana, avança para próximo dia útil
  while (isWeekend(result)) {
    result = addDays(result, 1);
  }
  
  return result;
};

/**
 * Retorna o próximo período comercial
 */
export const getNextBusinessPeriod = (date: Date): Date => {
  let result = new Date(date);
  
  if (isWeekend(result)) {
    while (isWeekend(result)) {
      result = addDays(result, 1);
    }
    result = setHours(setMinutes(result, 9), 9);
  }
  
  return adjustToBusinessHours(result);
};

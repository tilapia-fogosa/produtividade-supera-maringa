import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatInTimeZone } from 'date-fns-tz'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata uma data para o formato brasileiro (DD/MM/YYYY)
 */
export function formatDateBr(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Formata uma data para o fuso horário de São Paulo
 */
export function formatDateSaoPaulo(date: Date | string, format: string = 'dd/MM/yyyy HH:mm'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(dateObj, 'America/Sao_Paulo', format);
}

/**
 * Converte uma data string (YYYY-MM-DD) do fuso de São Paulo para UTC ISO
 * Útil para garantir que datas selecionadas em inputs sejam salvas corretamente
 */
export function toUtcFromSaoPauloDate(dateStr: string): string {
  const dateWithTime = `${dateStr}T00:00:00`;
  const saoPauloDate = new Date(dateWithTime);
  // Ajusta para o fuso de São Paulo (-03:00)
  const utcDate = new Date(saoPauloDate.getTime() + (3 * 60 * 60 * 1000));
  return utcDate.toISOString();
}

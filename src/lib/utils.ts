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

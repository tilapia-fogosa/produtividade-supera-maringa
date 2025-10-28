export type DiaSemana = 'domingo' | 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado';

export interface HorarioFuncionamento {
  inicio: string;
  fim: string;
  aberto: boolean;
}

export const HORARIOS_FUNCIONAMENTO: Record<DiaSemana, HorarioFuncionamento> = {
  segunda: { inicio: '08:00', fim: '18:00', aberto: true },
  terca: { inicio: '08:00', fim: '20:30', aberto: true },
  quarta: { inicio: '08:00', fim: '20:30', aberto: true },
  quinta: { inicio: '08:00', fim: '18:00', aberto: true },
  sexta: { inicio: '08:00', fim: '18:00', aberto: true },
  sabado: { inicio: '08:00', fim: '12:00', aberto: true },
  domingo: { inicio: '00:00', fim: '00:00', aberto: false },
};

export const OPCOES_DURACAO = [
  { valor: 30, label: '30 minutos' },
  { valor: 60, label: '1 hora' },
  { valor: 90, label: '1 hora e 30 minutos' },
  { valor: 120, label: '2 horas' },
  { valor: 150, label: '2 horas e 30 minutos' },
  { valor: 180, label: '3 horas' },
];

export const TIPOS_EVENTO = [
  { valor: 'aula_zero', label: 'Aula Zero' },
  { valor: 'reuniao', label: 'Reunião' },
  { valor: 'bloqueio_temporario', label: 'Bloqueio Temporário' },
  { valor: 'treinamento', label: 'Treinamento' },
  { valor: 'atendimento_individual', label: 'Atendimento Individual' },
];

export function obterHorarioFuncionamento(data: Date): HorarioFuncionamento {
  const diasSemana: DiaSemana[] = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  const diaSemana = diasSemana[data.getDay()];
  return HORARIOS_FUNCIONAMENTO[diaSemana];
}

export function calcularHorarioFim(horarioInicio: string, duracaoMinutos: number): string {
  const [horas, minutos] = horarioInicio.split(':').map(Number);
  const totalMinutos = horas * 60 + minutos + duracaoMinutos;
  const novasHoras = Math.floor(totalMinutos / 60);
  const novosMinutos = totalMinutos % 60;
  return `${String(novasHoras).padStart(2, '0')}:${String(novosMinutos).padStart(2, '0')}`;
}

export function horarioEstaNoFuncionamento(
  horarioInicio: string, 
  horarioFim: string, 
  funcionamento: HorarioFuncionamento
): boolean {
  if (!funcionamento.aberto) return false;
  return horarioInicio >= funcionamento.inicio && horarioFim <= funcionamento.fim;
}

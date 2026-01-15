import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, differenceInWeeks, parseISO, format } from 'date-fns';

const DATA_INICIO_CONTAGEM = '2026-02-01';
const HORAS_SEMANAIS_ESPERADAS = 44;

interface SaldoSemana {
  semana: string;
  horasTrabalhadas: number;
  horasEsperadas: number;
  saldo: number;
}

interface SaldoHorasResult {
  saldoTotalMinutos: number;
  saldoFormatado: string;
  semanasCompletas: number;
  horasTotaisTrabalhadas: number;
  horasEsperadas: number;
  saldosPorSemana: SaldoSemana[];
  isPositivo: boolean;
}

interface SaldoUsuario {
  userId: string;
  userName: string;
  userEmail: string;
  saldoTotalMinutos: number;
  saldoFormatado: string;
  horasTotaisTrabalhadas: number;
  horasEsperadas: number;
  semanasCompletas: number;
  isPositivo: boolean;
}

function formatarSaldo(minutos: number): string {
  const isPositivo = minutos >= 0;
  const absMinutos = Math.abs(minutos);
  const horas = Math.floor(absMinutos / 60);
  const mins = absMinutos % 60;
  const sinal = isPositivo ? '+' : '-';
  return `${sinal}${horas}h ${mins}min`;
}

function calcularHorasTrabalhadas(registros: { created_at: string; tipo_registro: string }[]): Map<string, number> {
  const horasPorDia = new Map<string, number>();
  
  // Ordenar por data/hora
  const registrosOrdenados = [...registros].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  let ultimaEntrada: Date | null = null;

  for (const registro of registrosOrdenados) {
    const dataRegistro = new Date(registro.created_at);
    const dataKey = format(dataRegistro, 'yyyy-MM-dd');

    if (registro.tipo_registro === 'entrada') {
      ultimaEntrada = dataRegistro;
    } else if (registro.tipo_registro === 'saida' && ultimaEntrada) {
      const minutosTrabalhadosNoPeriodo = Math.floor((dataRegistro.getTime() - ultimaEntrada.getTime()) / (1000 * 60));
      const minutosAtuais = horasPorDia.get(dataKey) || 0;
      horasPorDia.set(dataKey, minutosAtuais + minutosTrabalhadosNoPeriodo);
      ultimaEntrada = null;
    }
  }

  return horasPorDia;
}

function calcularSaldo(registros: { created_at: string; tipo_registro: string }[]): SaldoHorasResult {
  const dataInicio = parseISO(DATA_INICIO_CONTAGEM);
  const hoje = new Date();
  
  // Calcular semanas completas desde o início
  const inicioSemanaAtual = startOfWeek(hoje, { weekStartsOn: 1 }); // Segunda-feira
  const semanasCompletas = Math.max(0, differenceInWeeks(inicioSemanaAtual, dataInicio));
  
  // Calcular horas trabalhadas por dia
  const horasPorDia = calcularHorasTrabalhadas(registros);
  
  // Somar total de minutos trabalhados
  let totalMinutosTrabalhados = 0;
  horasPorDia.forEach((minutos) => {
    totalMinutosTrabalhados += minutos;
  });

  // Calcular horas esperadas
  const horasEsperadas = semanasCompletas * HORAS_SEMANAIS_ESPERADAS;
  const minutosEsperados = horasEsperadas * 60;

  // Calcular saldo
  const saldoMinutos = totalMinutosTrabalhados - minutosEsperados;

  // Calcular saldos por semana
  const saldosPorSemana: SaldoSemana[] = [];
  
  for (let i = 0; i < semanasCompletas; i++) {
    const inicioSemana = new Date(dataInicio);
    inicioSemana.setDate(inicioSemana.getDate() + (i * 7));
    const fimSemana = endOfWeek(inicioSemana, { weekStartsOn: 1 });
    
    let minutosSemana = 0;
    horasPorDia.forEach((minutos, data) => {
      const dataObj = parseISO(data);
      if (dataObj >= inicioSemana && dataObj <= fimSemana) {
        minutosSemana += minutos;
      }
    });

    saldosPorSemana.push({
      semana: format(inicioSemana, 'dd/MM/yyyy'),
      horasTrabalhadas: minutosSemana / 60,
      horasEsperadas: HORAS_SEMANAIS_ESPERADAS,
      saldo: (minutosSemana / 60) - HORAS_SEMANAIS_ESPERADAS,
    });
  }

  return {
    saldoTotalMinutos: saldoMinutos,
    saldoFormatado: formatarSaldo(saldoMinutos),
    semanasCompletas,
    horasTotaisTrabalhadas: totalMinutosTrabalhados / 60,
    horasEsperadas,
    saldosPorSemana,
    isPositivo: saldoMinutos >= 0,
  };
}

export function useSaldoHoras(userId: string | undefined) {
  return useQuery({
    queryKey: ['saldo-horas', userId],
    queryFn: async (): Promise<SaldoHorasResult> => {
      if (!userId) {
        return {
          saldoTotalMinutos: 0,
          saldoFormatado: '+0h 0min',
          semanasCompletas: 0,
          horasTotaisTrabalhadas: 0,
          horasEsperadas: 0,
          saldosPorSemana: [],
          isPositivo: true,
        };
      }

      const { data, error } = await supabase
        .from('registro_ponto')
        .select('created_at, tipo_registro')
        .eq('id_usuario', userId)
        .gte('created_at', DATA_INICIO_CONTAGEM)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return calcularSaldo(data || []);
    },
    enabled: !!userId,
  });
}

export function useSaldoHorasTodos() {
  return useQuery({
    queryKey: ['saldo-horas-todos'],
    queryFn: async (): Promise<SaldoUsuario[]> => {
      // Buscar todos os registros com perfil
      const { data, error } = await supabase
        .from('registro_ponto')
        .select(`
          id_usuario,
          created_at,
          tipo_registro
        `)
        .gte('created_at', DATA_INICIO_CONTAGEM)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Buscar perfis separadamente
      const userIds = [...new Set((data || []).map(r => r.id_usuario))];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const profilesMap = new Map<string, { full_name: string | null; email: string | null }>();
      (profiles || []).forEach(p => {
        profilesMap.set(p.id, { full_name: p.full_name, email: p.email });
      });

      // Agrupar por usuário
      const registrosPorUsuario = new Map<string, {
        registros: { created_at: string; tipo_registro: string }[];
        userName: string;
        userEmail: string;
      }>();

      (data || []).forEach((registro) => {
        const odUserId = registro.id_usuario;
        const profile = profilesMap.get(odUserId);
        const existing = registrosPorUsuario.get(odUserId);
        
        if (existing) {
          existing.registros.push({
            created_at: registro.created_at,
            tipo_registro: registro.tipo_registro,
          });
        } else {
          registrosPorUsuario.set(odUserId, {
            registros: [{
              created_at: registro.created_at,
              tipo_registro: registro.tipo_registro,
            }],
            userName: profile?.full_name || '',
            userEmail: profile?.email || '',
          });
        }
      });

      // Calcular saldo para cada usuário
      const resultado: SaldoUsuario[] = [];

      registrosPorUsuario.forEach((dados, odUserId) => {
        const saldo = calcularSaldo(dados.registros);
        resultado.push({
          userId: odUserId,
          userName: dados.userName,
          userEmail: dados.userEmail,
          saldoTotalMinutos: saldo.saldoTotalMinutos,
          saldoFormatado: saldo.saldoFormatado,
          horasTotaisTrabalhadas: saldo.horasTotaisTrabalhadas,
          horasEsperadas: saldo.horasEsperadas,
          semanasCompletas: saldo.semanasCompletas,
          isPositivo: saldo.isPositivo,
        });
      });

      // Ordenar por nome
      return resultado.sort((a, b) => 
        (a.userName || a.userEmail).localeCompare(b.userName || b.userEmail)
      );
    },
    enabled: true,
  });
}

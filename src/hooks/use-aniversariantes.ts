import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';

interface Aniversariante {
  id: string;
  nome: string;
  aniversario_mes_dia: string;
  tipo: 'aluno' | 'funcionario';
}

export const useAniversariantes = (unitId?: string) => {
  return useQuery({
    queryKey: ['aniversariantes', unitId],
    queryFn: async () => {
      const hoje = new Date();
      
      // Data de hoje no formato DD/MM
      const dataHoje = format(hoje, 'dd/MM');
      
      // Gerar lista de datas da semana no formato DD/MM (excluindo hoje)
      const datasSemana: string[] = [];
      const inicioSemana = startOfWeek(hoje, { weekStartsOn: 0 });
      for (let i = 0; i < 7; i++) {
        const data = addDays(inicioSemana, i);
        const dataStr = format(data, 'dd/MM');
        if (dataStr !== dataHoje) {
          datasSemana.push(dataStr);
        }
      }

      // Buscar alunos aniversariantes de hoje
      let queryHoje = supabase
        .from('alunos')
        .select('id, nome, aniversario_mes_dia')
        .eq('active', true)
        .eq('aniversario_mes_dia', dataHoje);

      if (unitId) {
        queryHoje = queryHoje.eq('unit_id', unitId);
      }

      const { data: alunosHoje } = await queryHoje;

      // Buscar alunos aniversariantes da semana
      let querySemana = supabase
        .from('alunos')
        .select('id, nome, aniversario_mes_dia')
        .eq('active', true)
        .in('aniversario_mes_dia', datasSemana);

      if (unitId) {
        querySemana = querySemana.eq('unit_id', unitId);
      }

      const { data: alunosSemana } = await querySemana;

      return {
        aniversariantesHoje: (alunosHoje || []).map(a => ({
          ...a,
          tipo: 'aluno' as const
        })),
        aniversariantesSemana: (alunosSemana || []).map(a => ({
          ...a,
          tipo: 'aluno' as const
        })),
      };
    },
  });
};

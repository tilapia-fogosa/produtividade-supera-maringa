import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type FaltaFutura = {
  id: string;
  aluno_nome: string;
  turma_nome: string;
  data_falta: string;
  responsavel_aviso_nome: string;
  responsavel_aviso_tipo: string;
  observacoes?: string;
  created_at: string;
  unit_id: string;
};

export const useListaFaltasFuturas = () => {
  return useQuery({
    queryKey: ["lista-faltas-futuras"],
    queryFn: async () => {
      console.log('🗓️ useListaFaltasFuturas - Buscando faltas futuras');

      const { data, error } = await supabase
        .from('faltas_antecipadas')
        .select(`
          id,
          data_falta,
          responsavel_aviso_nome,
          responsavel_aviso_tipo,
          observacoes,
          created_at,
          unit_id,
          aluno_id,
          turma_id
        `)
        .eq('active', true)
        .order('data_falta', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar faltas futuras:', error);
        throw error;
      }

      console.log('✅ Faltas futuras retornadas:', data?.length || 0);

      // Buscar nomes dos alunos e turmas separadamente
      const alunoIds = [...new Set(data?.map(f => f.aluno_id) || [])];
      const turmaIds = [...new Set(data?.map(f => f.turma_id) || [])];

      const [alunosData, turmasData] = await Promise.all([
        supabase.from('alunos').select('id, nome').in('id', alunoIds),
        supabase.from('turmas').select('id, nome').in('id', turmaIds)
      ]);

      const alunosMap = new Map(alunosData.data?.map(a => [a.id, a.nome]) || []);
      const turmasMap = new Map(turmasData.data?.map(t => [t.id, t.nome]) || []);

      const faltasFormatadas: FaltaFutura[] = (data || []).map(falta => ({
        id: falta.id,
        aluno_nome: alunosMap.get(falta.aluno_id) || 'Nome não encontrado',
        turma_nome: turmasMap.get(falta.turma_id) || 'Turma não encontrada',
        data_falta: falta.data_falta,
        responsavel_aviso_nome: falta.responsavel_aviso_nome,
        responsavel_aviso_tipo: falta.responsavel_aviso_tipo,
        observacoes: falta.observacoes,
        created_at: falta.created_at,
        unit_id: falta.unit_id,
      }));

      return faltasFormatadas;
    },
  });
};
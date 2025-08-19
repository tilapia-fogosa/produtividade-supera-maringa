import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type FaltaAntecipada = {
  id: string;
  data_falta: string;
  aluno_nome: string;
  responsavel_aviso_nome: string;
  responsavel_aviso_tipo: string;
  observacoes?: string;
  turma_nome: string;
  unit_id: string;
  turma_id: string;
  aluno_id: string;
  responsavel_aviso_id: string;
};

export const useListaFaltasAntecipadas = () => {
  return useQuery({
    queryKey: ["lista-faltas-antecipadas"],
    queryFn: async () => {
      console.log('🗓️ useListaFaltasAntecipadas - Buscando faltas antecipadas');
      
      const { data, error } = await supabase
        .from('faltas_antecipadas')
        .select(`
          id,
          data_falta,
          observacoes,
          responsavel_aviso_nome,
          responsavel_aviso_tipo,
          unit_id,
          turma_id,
          aluno_id,
          responsavel_aviso_id,
          alunos!inner(nome),
          turmas!inner(nome)
        `)
        .eq('active', true)
        .order('data_falta', { ascending: false });
      
      if (error) {
        console.error('❌ Erro ao buscar faltas antecipadas:', error);
        throw error;
      }
      
      console.log('✅ Faltas antecipadas retornadas:', data?.length || 0);
      
      // Transformar os dados para o formato esperado
      const faltasFormatadas: FaltaAntecipada[] = (data || []).map(falta => ({
        id: falta.id,
        data_falta: falta.data_falta,
        aluno_nome: (falta.alunos as any)?.nome || 'Nome não encontrado',
        responsavel_aviso_nome: falta.responsavel_aviso_nome,
        responsavel_aviso_tipo: falta.responsavel_aviso_tipo,
        observacoes: falta.observacoes,
        turma_nome: (falta.turmas as any)?.nome || 'Turma não encontrada',
        unit_id: falta.unit_id,
        turma_id: falta.turma_id,
        aluno_id: falta.aluno_id,
        responsavel_aviso_id: falta.responsavel_aviso_id,
      }));
      
      return faltasFormatadas;
    }
  });
};
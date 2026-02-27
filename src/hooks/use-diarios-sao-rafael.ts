import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProdutividadeAbacoItem {
  id: string;
  data_aula: string;
  apostila: string | null;
  pagina: string | null;
  exercicios: number | null;
  erros: number | null;
  presente: boolean;
  fez_desafio: boolean | null;
  is_reposicao: boolean;
  comentario: string | null;
  motivo_falta: string | null;
}

export interface ProdutividadeAHItem {
  id: string;
  apostila: string | null;
  exercicios: number | null;
  erros: number | null;
  professor_correcao: string | null;
  comentario: string | null;
  data_fim_correcao: string | null;
  created_at: string;
}

export function useDiariosSaoRafael(alunoId: string | null, mesAno: string) {
  const [dadosAbaco, setDadosAbaco] = useState<ProdutividadeAbacoItem[]>([]);
  const [dadosAH, setDadosAH] = useState<ProdutividadeAHItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!alunoId || !mesAno) {
      setDadosAbaco([]);
      setDadosAH([]);
      return;
    }

    setLoading(true);
    try {
      const ultimoDia = new Date(
        parseInt(mesAno.split('-')[0]),
        parseInt(mesAno.split('-')[1]),
        0
      ).getDate();
      const dataInicial = `${mesAno}-01`;
      const dataFinal = `${mesAno}-${ultimoDia.toString().padStart(2, '0')}`;

      const [abacoRes, ahRes] = await Promise.all([
        supabase
          .from('produtividade_abaco')
          .select('id, data_aula, apostila, pagina, exercicios, erros, presente, fez_desafio, is_reposicao, comentario, motivo_falta')
          .eq('pessoa_id', alunoId)
          .gte('data_aula', dataInicial)
          .lte('data_aula', dataFinal)
          .order('data_aula', { ascending: true }),
        supabase
          .from('produtividade_ah')
          .select('id, apostila, exercicios, erros, professor_correcao, comentario, data_fim_correcao, created_at')
          .eq('pessoa_id', alunoId)
          .gte('data_fim_correcao', `${dataInicial}T00:00:00.000Z`)
          .lte('data_fim_correcao', `${dataFinal}T23:59:59.999Z`)
          .order('data_fim_correcao', { ascending: true }),
      ]);

      setDadosAbaco(abacoRes.data || []);
      setDadosAH(ahRes.data || []);
    } catch (error) {
      console.error('Erro ao buscar diários:', error);
    } finally {
      setLoading(false);
    }
  }, [alunoId, mesAno]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { dadosAbaco, dadosAH, loading, refetch: fetchData };
}

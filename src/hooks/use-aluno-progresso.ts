
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface AlunoProgresso {
  ultimo_nivel: string | null;
  ultima_pagina: string | null;
  ultima_correcao_ah: string | null;
  apostila_atual: string | null;
  total_paginas: number | null;
}

export const useAlunoProgresso = (alunoId: string) => {
  const [loading, setLoading] = useState(true);
  const [progresso, setProgresso] = useState<AlunoProgresso | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgresso = async () => {
      try {
        setLoading(true);
        setError(null);

        // Buscar dados do aluno
        const { data: alunoData, error: alunoError } = await supabase
          .from('alunos')
          .select('ultimo_nivel, ultima_pagina, ultima_correcao_ah, apostila_atual')
          .eq('id', alunoId)
          .single();

        if (alunoError) throw alunoError;

        let totalPaginas = null;
        if (alunoData.apostila_atual) {
          // Buscar total de páginas da apostila atual
          const { data: apostilaData, error: apostilaError } = await supabase
            .from('apostilas')
            .select('total_paginas')
            .eq('nome', alunoData.apostila_atual)
            .maybeSingle();

          if (apostilaError) throw apostilaError;
          
          if (apostilaData) {
            totalPaginas = apostilaData.total_paginas;
          }
        }

        setProgresso({
          ...alunoData,
          total_paginas: totalPaginas
        });
      } catch (error) {
        console.error('Erro ao buscar progresso do aluno:', error);
        setError('Erro ao buscar dados do aluno');
      } finally {
        setLoading(false);
      }
    };

    if (alunoId) {
      fetchProgresso();
    }
  }, [alunoId]);

  return { progresso, loading, error };
};

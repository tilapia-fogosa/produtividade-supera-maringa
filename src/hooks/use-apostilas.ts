
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";

export interface Apostila {
  nome: string;
  total_paginas: number;
}

export const useApostilas = () => {
  const [apostilas, setApostilas] = useState<Apostila[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar todas as apostilas do banco
  useEffect(() => {
    const carregarApostilas = async () => {
      try {
        console.log('Hook useApostilas: Iniciando carregamento de apostilas');
        setLoading(true);
        setError(null);
        
        const { data: apostilasDB, error } = await supabase
          .from('apostilas')
          .select('nome, total_paginas')
          .order('nome');
          
        if (error) {
          console.error('Hook useApostilas: Erro na consulta do Supabase:', error);
          setError('Erro ao carregar apostilas');
          return;
        }
        
        if (apostilasDB && apostilasDB.length > 0) {
          console.log(`Hook useApostilas: Carregadas ${apostilasDB.length} apostilas do banco`);
          
          // Converter total_paginas para número explicitamente
          const apostilasConvertidas = apostilasDB.map(a => {
            const totalPaginas = typeof a.total_paginas === 'number' ? a.total_paginas : Number(a.total_paginas);
            console.log(`Hook useApostilas: Apostila: ${a.nome}, total_paginas (original): ${a.total_paginas}, convertido: ${totalPaginas}, tipo: ${typeof totalPaginas}`);
            
            return {
              nome: a.nome,
              total_paginas: totalPaginas
            };
          });
          
          setApostilas(apostilasConvertidas);
        } else {
          console.log('Hook useApostilas: Nenhuma apostila encontrada no banco');
          setApostilas([]);
        }
      } catch (err) {
        console.error('Hook useApostilas: Erro ao carregar apostilas:', err);
        setError('Erro ao carregar apostilas do banco de dados');
      } finally {
        setLoading(false);
      }
    };
    
    carregarApostilas();
  }, []);

  // Função auxiliar para buscar uma apostila pelo nome
  const getApostila = useCallback((nome: string | null | undefined): Apostila | undefined => {
    if (!nome) return undefined;
    
    const apostila = apostilas.find(a => a.nome === nome);
    console.log(`Hook useApostilas: Buscando apostila '${nome}', encontrada:`, apostila || 'não encontrada');
    
    return apostila;
  }, [apostilas]);

  // Função para obter o total de páginas de uma apostila
  const getTotalPaginas = useCallback((nome: string | null | undefined): number => {
    if (!nome) return 40; // Valor padrão
    
    const apostila = getApostila(nome);
    const totalPaginas = apostila ? apostila.total_paginas : 40;
    console.log(`Hook useApostilas: Total de páginas para '${nome}': ${totalPaginas}`);
    
    return totalPaginas;
  }, [getApostila]);

  return {
    apostilas,
    loading,
    error,
    getApostila,
    getTotalPaginas
  };
};

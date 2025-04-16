
import { supabase } from "@/integrations/supabase/client";

// Interface para representar dados da apostila
export interface ApostilaInfo {
  nome: string;
  total_paginas: number;
}

// Função otimizada para obter informações da apostila do banco (mantemos por compatibilidade)
export const obterInfoApostila = async (nomeApostila: string | null): Promise<ApostilaInfo> => {
  if (!nomeApostila) return { nome: "", total_paginas: 40 };
  
  console.log('apostilasUtils: Buscando informações da apostila:', nomeApostila);
  
  try {
    // Buscar diretamente no banco pelo nome exato
    const { data: apostila, error } = await supabase
      .from('apostilas')
      .select('nome, total_paginas')
      .eq('nome', nomeApostila)
      .maybeSingle();
      
    if (error) {
      console.error('apostilasUtils: Erro na consulta do Supabase:', error);
      return { nome: nomeApostila, total_paginas: 40 };
    }
    
    if (apostila) {
      console.log('apostilasUtils: Apostila encontrada no banco:', apostila);
      const totalPaginas = Number(apostila.total_paginas);
      console.log('apostilasUtils: Total de páginas convertido para número:', totalPaginas);
      
      return { 
        nome: apostila.nome, 
        total_paginas: totalPaginas
      };
    } else {
      console.log('apostilasUtils: Apostila não encontrada no banco:', nomeApostila);
      return { 
        nome: nomeApostila, 
        total_paginas: 40 
      };
    }
  } catch (err) {
    console.error('apostilasUtils: Erro ao buscar informações da apostila:', err);
    return { 
      nome: nomeApostila, 
      total_paginas: 40 
    };
  }
};

// Função para carregar todas as apostilas do banco
export const carregarApostilasDisponiveis = async (): Promise<ApostilaInfo[]> => {
  try {
    console.log('apostilasUtils: Carregando todas as apostilas disponíveis');
    
    const { data: apostilasDB, error } = await supabase
      .from('apostilas')
      .select('nome, total_paginas')
      .order('nome');
      
    if (error) {
      console.error('apostilasUtils: Erro na consulta do Supabase:', error);
      throw error;
    }
    
    if (apostilasDB && apostilasDB.length > 0) {
      console.log(`apostilasUtils: Carregadas ${apostilasDB.length} apostilas do banco`);
      
      // Converter explicitamente total_paginas para número e fazer log para debug
      const apostilasConvertidas = apostilasDB.map(a => {
        const totalPaginas = Number(a.total_paginas);
        console.log(`apostilasUtils: Apostila: ${a.nome}, total_paginas (original): ${a.total_paginas}, convertido: ${totalPaginas}, tipo: ${typeof totalPaginas}`);
        
        return {
          nome: a.nome,
          total_paginas: totalPaginas
        };
      });
      
      return apostilasConvertidas;
    } else {
      console.log('apostilasUtils: Nenhuma apostila encontrada no banco');
      return [];
    }
  } catch (err) {
    console.error('apostilasUtils: Erro ao carregar apostilas:', err);
    return [];
  }
};

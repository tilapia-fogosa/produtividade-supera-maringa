import { supabase } from "@/integrations/supabase/client";

// Função para normalizar o nome da apostila para encontrar uma correspondência no banco de dados
export const encontrarApostilaMaisProxima = (ultimoNivel: string | null): string => {
  if (!ultimoNivel) return "";
  
  console.log('Buscando apostila para:', ultimoNivel);
  
  // Mapeamento de nomes de apostilas para o formato exato do banco de dados
  const mapeamentoApostilas: Record<string, string> = {
    // Usando exatamente os nomes do banco de dados para evitar problemas
    "Ábaco INT. 1": "Ábaco INT. 1",
    "Ábaco INT. 2": "Ábaco INT. 2",
    "Ábaco INT. 3": "Ábaco INT. 3",
    "Ábaco INT. 4": "Ábaco INT. 4",
    "Ábaco AV. 1": "Ábaco AV. 1",
    "Ábaco AV. 2": "Ábaco AV. 2",
    "Ábaco AV. 3": "Ábaco AV. 3",
    "Ábaco AV. 4": "Ábaco AV. 4",
    
    // Mapeamentos dos formatos antigos para os novos formatos (usando toLowerCase para ignorar maiúsculas/minúsculas)
    "ap. abaco 1": "Ábaco INT. 1",
    "ap. abaco 2": "Ábaco INT. 2",
    "ap. abaco 3": "Ábaco INT. 3",
    "ap. abaco 4": "Ábaco INT. 4",
    "ap. abaco avancado 1": "Ábaco AV. 1",
    "ap. abaco avancado 2": "Ábaco AV. 2",
    "ap. abaco avancado 3": "Ábaco AV. 3",
    "ap. abaco avancado 4": "Ábaco AV. 4"
  };
  
  // Procurar primeiro pelo nome exato
  if (mapeamentoApostilas[ultimoNivel]) {
    console.log('Correspondência exata encontrada para:', ultimoNivel);
    return mapeamentoApostilas[ultimoNivel];
  }
  
  // Tentar encontrar uma correspondência ignorando maiúsculas/minúsculas
  const chaveNormalizada = ultimoNivel.toLowerCase();
  if (mapeamentoApostilas[chaveNormalizada]) {
    console.log('Correspondência normalizada encontrada para:', ultimoNivel);
    return mapeamentoApostilas[chaveNormalizada];
  }
  
  // Se não encontrar, retornar o nome original
  console.log('Nenhuma correspondência encontrada. Retornando nome original:', ultimoNivel);
  return ultimoNivel;
};

// Nova função que busca diretamente na tabela apostilas
export const encontrarApostila = async (nomeApostila: string | null): Promise<string> => {
  if (!nomeApostila) return "";
  
  console.log('Buscando apostila no banco:', nomeApostila);
  
  const { data: apostila, error } = await supabase
    .from('apostilas')
    .select('nome')
    .eq('nome', nomeApostila)
    .single();
    
  if (error) {
    console.error('Erro ao buscar apostila:', error);
    return nomeApostila;
  }
  
  if (apostila) {
    console.log('Apostila encontrada:', apostila.nome);
    return apostila.nome;
  }

  console.log('Apostila não encontrada, retornando nome original:', nomeApostila);
  return nomeApostila;
};

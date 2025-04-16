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

// Interface para representar dados da apostila
export interface ApostilaInfo {
  nome: string;
  total_paginas: number;
}

// Função que busca diretamente na tabela apostilas
export const encontrarApostila = async (nomeApostila: string | null): Promise<string> => {
  if (!nomeApostila) return "";
  
  console.log('Buscando apostila no banco:', nomeApostila);
  
  // Lista completa de mapeamentos de apostilas (nomes alternativos para os padrões)
  const mapeamentosCompletos: Record<string, string> = {
    // Mapeamentos exatos 
    "Ábaco INT. 1": "Ábaco INT. 1",
    "Ábaco INT. 2": "Ábaco INT. 2",
    "Ábaco INT. 3": "Ábaco INT. 3",
    "Ábaco INT. 4": "Ábaco INT. 4",
    "Ábaco AV. 1": "Ábaco AV. 1", 
    "Ábaco AV. 2": "Ábaco AV. 2",
    "Ábaco AV. 3": "Ábaco AV. 3",
    "Ábaco AV. 4": "Ábaco AV. 4",
    
    // Mapeamentos para Ap. Abaco 1
    "AP. ABACO 1": "Ábaco INT. 1",
    "Ap. Abaco 1": "Ábaco INT. 1",
    "ap. abaco 1": "Ábaco INT. 1",
    "Ap Abaco 1": "Ábaco INT. 1",
    "Abaco 1": "Ábaco INT. 1",
    "Ábaco 1": "Ábaco INT. 1",
    
    // Mapeamentos para Ap. Abaco 2
    "AP. ABACO 2": "Ábaco INT. 2", 
    "Ap. Abaco 2": "Ábaco INT. 2",
    "ap. abaco 2": "Ábaco INT. 2",
    "Ap Abaco 2": "Ábaco INT. 2",
    "Abaco 2": "Ábaco INT. 2",
    "Ábaco 2": "Ábaco INT. 2",
    
    // Outros mapeamentos de nomenclaturas antigas
    "Ap. Abaco 3": "Ábaco INT. 3",
    "ap. abaco 3": "Ábaco INT. 3",
    "Ap. Abaco 4": "Ábaco INT. 4",
    "ap. abaco 4": "Ábaco INT. 4"
  };
  
  // Primeiro, verificar se existe um mapeamento direto
  if (mapeamentosCompletos[nomeApostila]) {
    const nomePadronizado = mapeamentosCompletos[nomeApostila];
    console.log(`Mapeamento encontrado: ${nomeApostila} -> ${nomePadronizado}`);
    
    // Buscar no banco o nome padronizado
    const { data: apostila } = await supabase
      .from('apostilas')
      .select('nome')
      .eq('nome', nomePadronizado)
      .maybeSingle();
      
    if (apostila) {
      console.log('Apostila encontrada no banco:', apostila.nome);
      return apostila.nome;
    }
    
    // Se não encontrou a versão padronizada, retorná-la mesmo assim
    console.log('Nome padronizado definido, mas não encontrado no banco:', nomePadronizado);
    return nomePadronizado;
  }
  
  // Busca por similaridade se não encontrou mapeamento direto
  try {
    // Buscar todas as apostilas
    const { data: todasApostilas } = await supabase
      .from('apostilas')
      .select('nome')
      .order('nome');
      
    if (todasApostilas && todasApostilas.length > 0) {
      // Função para normalizar strings para comparação
      const normalizar = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
      const nomeNormalizado = normalizar(nomeApostila);
      
      // Procurar por similaridade
      for (const apostila of todasApostilas) {
        if (normalizar(apostila.nome).includes(nomeNormalizado) || 
            nomeNormalizado.includes(normalizar(apostila.nome))) {
          console.log(`Apostila similar encontrada: ${nomeApostila} -> ${apostila.nome}`);
          return apostila.nome;
        }
      }
    }
  } catch (err) {
    console.error('Erro ao buscar apostilas similares:', err);
  }
  
  // Caso não tenha mapeamento direto, verificar no banco com o nome original
  const { data: apostilaOriginal } = await supabase
    .from('apostilas')
    .select('nome')
    .eq('nome', nomeApostila)
    .maybeSingle();
    
  if (apostilaOriginal) {
    console.log('Apostila encontrada no banco com nome original:', apostilaOriginal.nome);
    return apostilaOriginal.nome;
  }
  
  console.log('Apostila não encontrada no banco nem nos mapeamentos. Nome original:', nomeApostila);
  
  // Se não encontrou nem no mapeamento nem no banco, retorna o nome original
  return nomeApostila;
};

// Nova função para obter apostila com informações completas (nome e páginas)
export const obterInfoApostila = async (nomeApostila: string | null): Promise<ApostilaInfo> => {
  if (!nomeApostila) return { nome: "", total_paginas: 40 };
  
  console.log('Buscando informações completas da apostila:', nomeApostila);
  
  // Lista completa de mapeamentos de apostilas (nomes alternativos para os padrões)
  const mapeamentosCompletos: Record<string, string> = {
    // Mapeamentos exatos 
    "Ábaco INT. 1": "Ábaco INT. 1",
    "Ábaco INT. 2": "Ábaco INT. 2",
    "Ábaco INT. 3": "Ábaco INT. 3",
    "Ábaco INT. 4": "Ábaco INT. 4",
    "Ábaco AV. 1": "Ábaco AV. 1", 
    "Ábaco AV. 2": "Ábaco AV. 2",
    "Ábaco AV. 3": "Ábaco AV. 3",
    "Ábaco AV. 4": "Ábaco AV. 4",
    "Ábaco Jr. 1": "Ábaco Jr. 1",
    "Ábaco Jr. 2": "Ábaco Jr. 2",
    "Ábaco Jr. 3": "Ábaco Jr. 3",
    "Ábaco Jr. 4": "Ábaco Jr. 4",
    "Ábaco 5": "Ábaco 5", 
    "Ábaco 6": "Ábaco 6",
    
    // Mapeamentos para Ap. Abaco X
    "AP. ABACO 1": "Ábaco INT. 1",
    "Ap. Abaco 1": "Ábaco INT. 1",
    "ap. abaco 1": "Ábaco INT. 1",
    "Ap Abaco 1": "Ábaco INT. 1",
    "Abaco 1": "Ábaco INT. 1",
    "Ábaco 1": "Ábaco INT. 1",
    
    "AP. ABACO 2": "Ábaco INT. 2", 
    "Ap. Abaco 2": "Ábaco INT. 2",
    "ap. abaco 2": "Ábaco INT. 2",
    "Ap Abaco 2": "Ábaco INT. 2",
    "Abaco 2": "Ábaco INT. 2",
    "Ábaco 2": "Ábaco INT. 2",
    
    "Ap. Abaco 3": "Ábaco INT. 3",
    "ap. abaco 3": "Ábaco INT. 3",
    "Abaco 3": "Ábaco INT. 3",
    "Ábaco 3": "Ábaco INT. 3",
    
    "Ap. Abaco 4": "Ábaco INT. 4",
    "ap. abaco 4": "Ábaco INT. 4",
    "Abaco 4": "Ábaco INT. 4",
    "Ábaco 4": "Ábaco INT. 4",
    
    "Ap. Abaco 5": "Ábaco 5",
    "ap. abaco 5": "Ábaco 5",
    "Abaco 5": "Ábaco 5",
    
    "Ap. Abaco 6": "Ábaco 6",
    "ap. abaco 6": "Ábaco 6",
    "Abaco 6": "Ábaco 6"
  };
  
  // Primeiro, verificar se existe um mapeamento direto
  let nomePadronizado = nomeApostila;
  if (mapeamentosCompletos[nomeApostila]) {
    nomePadronizado = mapeamentosCompletos[nomeApostila];
    console.log(`Mapeamento encontrado: ${nomeApostila} -> ${nomePadronizado}`);
  }
  
  try {
    // Buscar no banco pelo nome exato
    const { data: apostila, error } = await supabase
      .from('apostilas')
      .select('nome, total_paginas')
      .eq('nome', nomePadronizado)
      .maybeSingle();
      
    if (!error && apostila) {
      console.log('Apostila encontrada no banco por nome exato:', apostila);
      return { 
        nome: apostila.nome, 
        total_paginas: Number(apostila.total_paginas) 
      };
    }
    
    // Se não encontrou com o nome padronizado, tenta com o nome original
    if (nomePadronizado !== nomeApostila) {
      const { data: apostilaOriginal } = await supabase
        .from('apostilas')
        .select('nome, total_paginas')
        .eq('nome', nomeApostila)
        .maybeSingle();
        
      if (apostilaOriginal) {
        console.log('Apostila encontrada com nome original:', apostilaOriginal);
        return { 
          nome: apostilaOriginal.nome, 
          total_paginas: Number(apostilaOriginal.total_paginas) 
        };
      }
    }
    
    // Buscar todas as apostilas para comparação por similaridade
    const { data: todasApostilas } = await supabase
      .from('apostilas')
      .select('nome, total_paginas')
      .order('nome');
      
    if (todasApostilas && todasApostilas.length > 0) {
      console.log(`Buscando por similaridade entre ${todasApostilas.length} apostilas`);
      
      // Função para normalizar strings para comparação
      const normalizar = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
      const nomeNormalizado = normalizar(nomeApostila);
      
      // Procurar por similaridade
      for (const apostila of todasApostilas) {
        const apostilaNormalizada = normalizar(apostila.nome);
        
        if (apostilaNormalizada.includes(nomeNormalizado) || 
            nomeNormalizado.includes(apostilaNormalizada)) {
          console.log(`Apostila similar encontrada: ${nomeApostila} -> ${apostila.nome} (${apostila.total_paginas} páginas)`);
          return { 
            nome: apostila.nome, 
            total_paginas: Number(apostila.total_paginas) 
          };
        }
      }
      
      // Se não encontrou similar, logs de debug
      console.log('Apostilas disponíveis:');
      todasApostilas.forEach(a => {
        console.log(`- ${a.nome} (${a.total_paginas} páginas)`);
      });
    }
  } catch (err) {
    console.error('Erro ao buscar informações da apostila:', err);
  }
  
  // Se não encontrou no banco, retorna o nome original com número padrão de páginas
  console.log('Apostila não encontrada no banco. Usando valor padrão de 40 páginas para:', nomeApostila);
  return { 
    nome: nomeApostila, 
    total_paginas: 40 
  };
};

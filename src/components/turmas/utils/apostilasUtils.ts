
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
  
  // Se chegou aqui, não encontrou nem no mapeamento nem no banco
  // Vamos criar uma nova apostila no banco agora
  try {
    console.log('Tentando criar nova apostila:', nomeApostila);
    
    const { data: novaApostila, error } = await supabase
      .from('apostilas')
      .insert([
        { nome: nomeApostila, total_paginas: 40 }
      ])
      .select()
      .single();
      
    if (error) {
      console.error('Erro ao criar apostila:', error);
      
      // Em caso de erro, verificar se o erro é por RLS, tentar buscar novamente 
      // para garantir que realmente não existe
      const { data: verificarNovamente } = await supabase
        .from('apostilas')
        .select('nome')
        .eq('nome', nomeApostila)
        .maybeSingle();
        
      if (verificarNovamente) {
        console.log('Apostila encontrada após segunda verificação:', verificarNovamente.nome);
        return verificarNovamente.nome;
      }
    } else if (novaApostila) {
      console.log('Nova apostila criada com sucesso:', novaApostila.nome);
      return novaApostila.nome;
    }
  } catch (err) {
    console.error('Exceção ao tentar criar apostila:', err);
  }
  
  // Se não foi possível criar uma nova apostila, retorna o nome original
  return nomeApostila;
};

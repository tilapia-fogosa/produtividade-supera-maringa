
import { APOSTILAS_ABACO, MAPEAMENTO_APOSTILAS } from "../constants/apostilas";

export const encontrarApostilaMaisProxima = (ultimoNivel: string | null): string => {
  if (!ultimoNivel) return "";
  
  console.log('Buscando apostila para:', ultimoNivel);
  
  // Tratar casos especiais, como 'Ap. BPA 4'
  if (ultimoNivel === 'Ap. BPA 4' || ultimoNivel.includes('BPA 4')) {
    console.log('Caso especial de BPA 4 identificado');
    return 'Ap. BPA 4';
  }
  
  // Remover possíveis prefixos/sufixos comuns
  const normalizado = ultimoNivel
    .replace(/^ap\.\s*/i, 'Ap. ')
    .replace(/^apostila\s*/i, 'Ap. ')
    .trim();
  
  console.log('Nome normalizado:', normalizado);
  
  // Primeiro, tenta correspondência exata com o nome original
  const apostilaExata = APOSTILAS_ABACO.find(apostila => 
    apostila.toLowerCase() === ultimoNivel.toLowerCase() || 
    apostila.toLowerCase() === normalizado.toLowerCase()
  );
  
  if (apostilaExata) {
    console.log('Encontrou correspondência exata:', apostilaExata);
    return apostilaExata;
  }
  
  // Se não encontrou exata, tenta pelo mapeamento
  if (ultimoNivel in MAPEAMENTO_APOSTILAS) {
    const apostilaMapeada = MAPEAMENTO_APOSTILAS[ultimoNivel as keyof typeof MAPEAMENTO_APOSTILAS];
    console.log('Encontrou no mapeamento:', apostilaMapeada);
    return apostilaMapeada;
  }
  
  // Verifica correspondência parcial com o mapeamento
  for (const [padrao, apostila] of Object.entries(MAPEAMENTO_APOSTILAS)) {
    if (ultimoNivel.toLowerCase().includes(padrao.toLowerCase())) {
      console.log('Encontrou correspondência parcial no mapeamento:', apostila);
      return apostila;
    }
  }
  
  // Verifica correspondência parcial com a lista de apostilas
  const apostilaEncontrada = APOSTILAS_ABACO.find(apostila => 
    ultimoNivel.toLowerCase().includes(apostila.toLowerCase()) ||
    normalizado.toLowerCase().includes(apostila.toLowerCase())
  );
  
  if (apostilaEncontrada) {
    console.log('Encontrou na lista de apostilas:', apostilaEncontrada);
    return apostilaEncontrada;
  }
  
  console.log('Nenhuma correspondência encontrada, retornando nome normalizado:', normalizado);
  return normalizado; // Retorna o nome normalizado se não encontrar mapeamento
};

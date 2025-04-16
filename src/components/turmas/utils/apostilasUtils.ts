
import { APOSTILAS_ABACO, MAPEAMENTO_APOSTILAS } from "../constants/apostilas";

export const encontrarApostilaMaisProxima = (ultimoNivel: string | null): string => {
  if (!ultimoNivel) return "";
  
  console.log('Buscando apostila para:', ultimoNivel);
  
  // Primeiro, tenta correspondência exata com o nome original
  const apostilaExata = APOSTILAS_ABACO.find(apostila => apostila === ultimoNivel);
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
    if (ultimoNivel.includes(padrao)) {
      console.log('Encontrou correspondência parcial:', apostila);
      return apostila;
    }
  }
  
  // Verifica correspondência parcial com a lista de apostilas
  const apostilaEncontrada = APOSTILAS_ABACO.find(apostila => 
    ultimoNivel.toLowerCase().includes(apostila.toLowerCase())
  );
  
  if (apostilaEncontrada) {
    console.log('Encontrou na lista de apostilas:', apostilaEncontrada);
    return apostilaEncontrada;
  }
  
  console.log('Nenhuma correspondência encontrada, retornando nome original:', ultimoNivel);
  return ultimoNivel;
};

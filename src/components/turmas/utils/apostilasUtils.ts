
import { APOSTILAS_ABACO, MAPEAMENTO_APOSTILAS } from "../constants/apostilas";

// Função para encontrar a apostila mais próxima
export const encontrarApostilaMaisProxima = (ultimoNivel: string | null): string => {
  if (!ultimoNivel) return "";
  
  // Verificar correspondência exata
  if (ultimoNivel in MAPEAMENTO_APOSTILAS) {
    return MAPEAMENTO_APOSTILAS[ultimoNivel as keyof typeof MAPEAMENTO_APOSTILAS];
  }
  
  // Verificar correspondência parcial
  for (const [padrao, apostila] of Object.entries(MAPEAMENTO_APOSTILAS)) {
    if (ultimoNivel.includes(padrao)) {
      return apostila;
    }
  }
  
  // Verificar se alguma apostila está contida no ultimoNivel
  const apostilaEncontrada = APOSTILAS_ABACO.find(apostila => ultimoNivel.includes(apostila));
  if (apostilaEncontrada) {
    return apostilaEncontrada;
  }
  
  // Nenhuma correspondência encontrada
  return "";
};


export const encontrarApostilaMaisProxima = (ultimoNivel: string | null): string => {
  if (!ultimoNivel) return "";
  
  console.log('Buscando apostila para:', ultimoNivel);
  
  // Remover possíveis prefixos/sufixos comuns
  const normalizado = ultimoNivel
    .replace(/^ap\.\s*/i, '')
    .replace(/^apostila\s*/i, '')
    .trim();
  
  console.log('Nome normalizado:', normalizado);
  
  // Buscar correspondência exata com o nome normalizado
  return normalizado;
};


// Função para normalizar o nome da apostila para encontrar uma correspondência no banco de dados
export const encontrarApostilaMaisProxima = (ultimoNivel: string | null): string => {
  if (!ultimoNivel) return "";
  
  console.log('Buscando apostila para:', ultimoNivel);
  
  // Mapeamento de nomes de apostilas para o formato exato do banco de dados
  const mapeamentoApostilas: Record<string, string> = {
    // Mantendo os nomes exatos do banco de dados sem conversão
    "Ábaco INT. 1": "Ábaco INT. 1",
    "Ábaco INT. 2": "Ábaco INT. 2",
    "Ábaco INT. 3": "Ábaco INT. 3",
    "Ábaco INT. 4": "Ábaco INT. 4",
    "Ábaco AV. 1": "Ábaco AV. 1",
    "Ábaco AV. 2": "Ábaco AV. 2",
    "Ábaco AV. 3": "Ábaco AV. 3",
    "Ábaco AV. 4": "Ábaco AV. 4",
    
    // Mapeamentos antigos mantidos para compatibilidade com registros existentes
    "AP. Abaco 1": "Ábaco INT. 1",
    "AP. Abaco 2": "Ábaco INT. 2",
    "AP. Abaco 3": "Ábaco INT. 3",
    "AP. Abaco 4": "Ábaco INT. 4",
    "AP. Abaco Avancado 1": "Ábaco AV. 1",
    "AP. Abaco Avancado 2": "Ábaco AV. 2",
    "AP. Abaco Avancado 3": "Ábaco AV. 3",
    "AP. Abaco Avancado 4": "Ábaco AV. 4"
  };
  
  // Verificar se existe um mapeamento direto para este nome
  const nomeMapeado = mapeamentoApostilas[ultimoNivel] || ultimoNivel;
  
  console.log('Nome normalizado da apostila:', nomeMapeado);
  return nomeMapeado;
};

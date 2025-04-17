
// Tipos utilizados na função de produtividade
export interface ProdutividadeData {
  aluno_id: string;
  aluno_nome: string;
  turma_id: string;
  turma_nome: string;
  presente: boolean;
  motivo_falta?: string;
  apostila_abaco?: string;
  pagina_abaco?: string;
  exercicios_abaco?: string;
  erros_abaco?: string;
  fez_desafio?: boolean;
  nivel_desafio?: string;
  comentario?: string;
  data_registro: string;
  data_ultima_correcao_ah?: string;
  apostila_atual?: string;
  ultima_pagina?: string;
  is_reposicao?: boolean;
  niveldesafio?: number; // Adicionando o campo niveldesafio
}

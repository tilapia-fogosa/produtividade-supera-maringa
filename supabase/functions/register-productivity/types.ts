
export interface ProdutividadeData {
  aluno_id: string;
  aluno_nome?: string;
  turma_id?: string;
  turma_nome?: string;
  presente: boolean;
  motivo_falta?: string;
  apostila_abaco?: string;
  pagina_abaco?: string;
  exercicios_abaco?: string;
  erros_abaco?: string;
  fez_desafio?: boolean;
  nivel_desafio?: string;
  comentario?: string;
  data_registro?: string;
  data_aula?: string;
  apostila_atual?: string;
  ultima_pagina?: string;
  is_reposicao?: boolean;
  data_ultima_correcao_ah?: string;
}

export interface AlertaCriterio {
  tipo_criterio: string;
  detalhes: Record<string, any>;
  data_falta: string;
  aluno_nome: string;
  turma_id: string;
  professor_id: string;
  unit_id: string;
  dias_supera: number;
  motivo_falta: string;
  professor_nome: string;
  professor_slack: string;
}

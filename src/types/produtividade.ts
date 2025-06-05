
export interface ProdutividadeAbaco {
  id: string;
  aluno_id: string;
  data_aula: string;
  presente: boolean;
  is_reposicao: boolean;
  apostila: string | null;
  pagina: number | null;
  exercicios: number | null;
  erros: number | null;
  fez_desafio: boolean;
  comentario: string | null;
  motivo_falta: string | null; // Novo campo
  created_at: string;
  updated_at: string;
}

export interface FaltaAluno {
  id: string;
  aluno_id: string;
  data_falta: string;
  motivo: string | null;
  created_at: string;
}

export interface ProdutividadeAH {
  id: string;
  aluno_id: string;
  apostila: string | null;
  exercicios: number | null;
  erros: number | null;
  professor_correcao: string | null;
  comentario: string | null;
  created_at: string;
  updated_at: string;
}

export interface DesempenhoMensalItem {
  mes: string;
  livro: string;
  exercicios: number;
  erros: number;
  percentual_acerto: number;
}

export interface DesempenhoMensalAH extends DesempenhoMensalItem {}
export interface DesempenhoMensalAbaco extends DesempenhoMensalItem {}

export interface AlunoDevolutiva {
  id: string;
  nome: string;
  texto_geral: string | null;
  texto_devolutiva: string | null;
  desafios_feitos: number;
  desempenho_abaco: DesempenhoMensalAbaco[];
  desempenho_ah: DesempenhoMensalAH[];
  abaco_total_exercicios: number;
  abaco_total_erros: number;
  abaco_percentual_total: number;
  ah_total_exercicios: number;
  ah_total_erros: number;
  ah_percentual_total: number;
}


export interface ProdutividadeAbaco {
  id: string;
  aluno_id: string;
  data_aula: string;
  presente: boolean;
  is_reposicao: boolean;
  apostila: string | null;
  pagina: number | null; // Alterado de string para number
  exercicios: number | null;
  erros: number | null;
  fez_desafio: boolean;
  comentario: string | null;
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

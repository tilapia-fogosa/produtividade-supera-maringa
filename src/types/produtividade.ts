
export interface ProdutividadeAbaco {
  id: string;
  aluno_id: string;
  data_aula: string;
  presente: boolean;
  is_reposicao: boolean;
  apostila: string | null;
  pagina: string | null;
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

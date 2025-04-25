export interface Professor {
  id: string;
  nome: string;
  email: string;
  telefone: string;
}

export interface Turma {
  id: string;
  nome: string;
  professor_id: string;
  horario: string;
  sala: string;
}

export interface Aluno {
  id: string;
  nome: string;
  turma_id: string;
  codigo?: string;
  email?: string;
  telefone?: string;
  active: boolean;  // Adicionando o campo active
}

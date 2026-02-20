// Interface comum para pessoas que podem ter lançamentos AH
export interface PessoaAH {
  id: string;
  nome: string;
  turma_nome?: string | null;
  origem?: 'aluno' | 'funcionario';
  ultima_correcao_ah?: string | null;
}

// Função para converter TodosAlunosItem para PessoaAH
export const todosAlunosItemToPessoaAH = (item: any): PessoaAH => {
  console.log('Converting TodosAlunosItem to PessoaAH:', item);
  return {
    id: item.id,
    nome: item.nome,
    turma_nome: item.turma_nome,
    origem: item.origem,
    ultima_correcao_ah: item.ultima_correcao_ah
  };
};

// Função para converter PessoaTurmaDetalhes para PessoaAH
export const pessoaTurmaDetalhesToPessoaAH = (pessoa: any): PessoaAH => {
  console.log('Converting PessoaTurmaDetalhes to PessoaAH:', pessoa);
  return {
    id: pessoa.id,
    nome: pessoa.nome,
    turma_nome: pessoa.turma_nome || 'Sem turma', // PessoaTurmaDetalhes pode não ter turma_nome diretamente
    origem: pessoa.origem,
    ultima_correcao_ah: pessoa.ultima_correcao_ah
  };
};

// Função para converter Aluno para PessoaAH
export const alunoToPessoaAH = (aluno: any): PessoaAH => {
  console.log('Converting Aluno to PessoaAH:', aluno);
  return {
    id: aluno.id,
    nome: aluno.nome,
    turma_nome: aluno.turma_nome,
    origem: 'aluno',
    ultima_correcao_ah: aluno.ultima_correcao_ah
  };
};
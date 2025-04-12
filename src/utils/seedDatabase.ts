
import { supabase } from "@/integrations/supabase/client";

export const seedChristianeStudents = async () => {
  try {
    // Buscar ID da Christiane
    const { data: professorData, error: professorError } = await supabase
      .from('professores')
      .select('id')
      .eq('nome', 'Christiane')
      .single();

    if (professorError) {
      console.error('Erro ao encontrar professora Christiane:', professorError);
      return;
    }

    const professorId = professorData.id;

    // Buscar turmas da Christiane
    const { data: turmasData, error: turmasError } = await supabase
      .from('turmas')
      .select('id, nome')
      .eq('professor_id', professorId);

    if (turmasError) {
      console.error('Erro ao buscar turmas:', turmasError);
      return;
    }

    // Definir alunos para cada turma
    const turmaIdosos = turmasData.find(t => t.nome === 'Idosos')?.id;
    const turmaCriancas = turmasData.find(t => t.nome === 'Crianças')?.id;

    if (turmaIdosos) {
      // Adicionar alunos da turma de Idosos
      const alunosIdosos = [
        { nome: 'Maria da Silva', turma_id: turmaIdosos },
        { nome: 'José Oliveira', turma_id: turmaIdosos },
        { nome: 'Ana Paula', turma_id: turmaIdosos },
        { nome: 'Carlos Eduardo', turma_id: turmaIdosos },
        { nome: 'Terezinha Lima', turma_id: turmaIdosos },
        { nome: 'Antônio Costa', turma_id: turmaIdosos }
      ];

      const { error: erroInsercaoIdosos } = await supabase
        .from('alunos')
        .insert(alunosIdosos);

      if (erroInsercaoIdosos) {
        console.error('Erro ao inserir alunos idosos:', erroInsercaoIdosos);
      }
    }

    if (turmaCriancas) {
      // Adicionar alunos da turma de Crianças
      const alunosCriancas = [
        { nome: 'Bernardo Diniz Kolln', turma_id: turmaCriancas },
        { nome: 'Gabriel Agustinho Tadeu', turma_id: turmaCriancas },
        { nome: 'Gabriela Malerba Fertonani', turma_id: turmaCriancas },
        { nome: 'Maria Luiza Marques', turma_id: turmaCriancas },
        { nome: 'Melissa Harumi Kami', turma_id: turmaCriancas }
      ];

      const { error: erroInsercaoCriancas } = await supabase
        .from('alunos')
        .insert(alunosCriancas);

      if (erroInsercaoCriancas) {
        console.error('Erro ao inserir alunos crianças:', erroInsercaoCriancas);
      }
    }

    console.log('Dados da Christiane inseridos com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao inserir dados de teste:', error);
    return false;
  }
};

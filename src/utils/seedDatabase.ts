
import { supabase } from "@/integrations/supabase/client";

export const seedChristianeStudents = async () => {
  try {
    // Buscar ID da Christiane
    const { data: professorData, error: professorError } = await supabase
      .from('professores')
      .select('id, unit_id')
      .eq('nome', 'Christiane')
      .single();

    if (professorError) {
      console.error('Erro ao encontrar professora Christiane:', professorError);
      return;
    }

    const professorId = professorData.id;
    const unitId = professorData.unit_id; // Obter unit_id do professor

    // Buscar turmas da Christiane
    const { data: turmasData, error: turmasError } = await supabase
      .from('turmas')
      .select('id, nome, unit_id')
      .eq('professor_id', professorId);

    if (turmasError) {
      console.error('Erro ao buscar turmas:', turmasError);
      return;
    }

    // Definir alunos para cada turma
    const turmaIdosos = turmasData.find(t => t.nome === 'Idosos')?.id;
    const turmaCriancas = turmasData.find(t => t.nome === 'Crianças')?.id;
    const unitIdIdosos = turmasData.find(t => t.nome === 'Idosos')?.unit_id || unitId;
    const unitIdCriancas = turmasData.find(t => t.nome === 'Crianças')?.unit_id || unitId;

    if (turmaIdosos) {
      // Adicionar alunos da turma de Idosos
      const alunosIdosos = [
        { nome: 'Maria da Silva', turma_id: turmaIdosos, unit_id: unitIdIdosos },
        { nome: 'José Oliveira', turma_id: turmaIdosos, unit_id: unitIdIdosos },
        { nome: 'Ana Paula', turma_id: turmaIdosos, unit_id: unitIdIdosos },
        { nome: 'Carlos Eduardo', turma_id: turmaIdosos, unit_id: unitIdIdosos },
        { nome: 'Terezinha Lima', turma_id: turmaIdosos, unit_id: unitIdIdosos },
        { nome: 'Antônio Costa', turma_id: turmaIdosos, unit_id: unitIdIdosos }
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
        { nome: 'Bernardo Diniz Kolln', turma_id: turmaCriancas, unit_id: unitIdCriancas },
        { nome: 'Gabriel Agustinho Tadeu', turma_id: turmaCriancas, unit_id: unitIdCriancas },
        { nome: 'Gabriela Malerba Fertonani', turma_id: turmaCriancas, unit_id: unitIdCriancas },
        { nome: 'Maria Luiza Marques', turma_id: turmaCriancas, unit_id: unitIdCriancas },
        { nome: 'Melissa Harumi Kami', turma_id: turmaCriancas, unit_id: unitIdCriancas }
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

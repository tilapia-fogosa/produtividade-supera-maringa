import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

export interface ApostilaRecolhida {
  id: string;
  pessoa_nome: string;
  turma_nome: string;
  apostila: string;
  data_recolhida: string;
  data_entrega: string;
  pessoa_id: string;
  total_correcoes: number;
  exercicios_corrigidos?: number;
  erros?: number;
  data_entrega_real?: string;
  responsavel_entrega_nome?: string;
  foi_entregue: boolean;
  correcao_iniciada: boolean;
  responsavel_correcao_nome?: string;
  responsavel_correcao_tipo?: string;
  data_inicio_correcao?: string;
  professor_id?: string;
  professor_nome?: string;
}

export const useApostilasRecolhidas = () => {
  const { activeUnit } = useActiveUnit();

  return useQuery({
    queryKey: ["apostilas-recolhidas", activeUnit?.id],
    queryFn: async () => {
      const { data: recolhidas, error } = await supabase
        .from("ah_recolhidas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const apostilasComDetalhes = await Promise.all(
        recolhidas.map(async (recolhida) => {
          const { data: correcoes, count: totalCorrecoes } = await supabase
            .from("produtividade_ah")
            .select("exercicios, erros", { count: 'exact' })
            .eq("ah_recolhida_id", recolhida.id);
          
          const exerciciosTotal = correcoes?.reduce((sum, c) => sum + (c.exercicios || 0), 0) || 0;
          const errosTotal = correcoes?.reduce((sum, c) => sum + (c.erros || 0), 0) || 0;

          // Tentar buscar como aluno da unidade ativa
          const { data: aluno } = await supabase
            .from("alunos")
            .select("nome, turma_id, turmas(nome, professor_id)")
            .eq("id", recolhida.pessoa_id)
            .eq("unit_id", activeUnit!.id)
            .single();

          if (aluno) {
            const dataRecolhida = new Date(recolhida.created_at);
            const dataEntrega = new Date(dataRecolhida);
            dataEntrega.setDate(dataEntrega.getDate() + 14);

            let professorNome = "Sem professor";
            if (aluno.turmas?.professor_id) {
              const { data: professor } = await supabase
                .from("professores")
                .select("nome")
                .eq("id", aluno.turmas.professor_id)
                .single();
              if (professor) professorNome = professor.nome;
            }

            return {
              id: recolhida.id.toString(),
              pessoa_nome: aluno.nome,
              turma_nome: aluno.turmas?.nome || "Sem turma",
              apostila: recolhida.apostila,
              data_recolhida: recolhida.created_at,
              data_entrega: dataEntrega.toISOString(),
              pessoa_id: recolhida.pessoa_id,
              total_correcoes: totalCorrecoes || 0,
              exercicios_corrigidos: exerciciosTotal,
              erros: errosTotal,
              data_entrega_real: recolhida.data_entrega_real,
              responsavel_entrega_nome: recolhida.responsavel_entrega_nome,
              foi_entregue: !!recolhida.data_entrega_real,
              correcao_iniciada: recolhida.correcao_iniciada || false,
              responsavel_correcao_nome: recolhida.responsavel_correcao_nome,
              responsavel_correcao_tipo: recolhida.responsavel_correcao_tipo,
              data_inicio_correcao: recolhida.data_inicio_correcao,
              professor_id: aluno.turmas?.professor_id,
              professor_nome: professorNome,
            };
          }

          // Tentar como funcionário da unidade ativa
          const { data: funcionario } = await supabase
            .from("funcionarios")
            .select("nome, turma_id, turmas(nome, professor_id)")
            .eq("id", recolhida.pessoa_id)
            .eq("unit_id", activeUnit!.id)
            .single();

          if (funcionario) {
            const dataRecolhida = new Date(recolhida.created_at);
            const dataEntrega = new Date(dataRecolhida);
            dataEntrega.setDate(dataEntrega.getDate() + 14);

            let professorNome = "Sem professor";
            if (funcionario.turmas?.professor_id) {
              const { data: professor } = await supabase
                .from("professores")
                .select("nome")
                .eq("id", funcionario.turmas.professor_id)
                .single();
              if (professor) professorNome = professor.nome;
            }

            return {
              id: recolhida.id.toString(),
              pessoa_nome: funcionario.nome,
              turma_nome: funcionario.turmas?.nome || "Sem turma",
              apostila: recolhida.apostila,
              data_recolhida: recolhida.created_at,
              data_entrega: dataEntrega.toISOString(),
              pessoa_id: recolhida.pessoa_id,
              total_correcoes: totalCorrecoes || 0,
              exercicios_corrigidos: exerciciosTotal,
              erros: errosTotal,
              data_entrega_real: recolhida.data_entrega_real,
              responsavel_entrega_nome: recolhida.responsavel_entrega_nome,
              foi_entregue: !!recolhida.data_entrega_real,
              correcao_iniciada: recolhida.correcao_iniciada || false,
              responsavel_correcao_nome: recolhida.responsavel_correcao_nome,
              responsavel_correcao_tipo: recolhida.responsavel_correcao_tipo,
              data_inicio_correcao: recolhida.data_inicio_correcao,
              professor_id: funcionario.turmas?.professor_id,
              professor_nome: professorNome,
            };
          }

          // Não pertence à unidade ativa
          return null;
        })
      );

      return apostilasComDetalhes.filter(Boolean) as ApostilaRecolhida[];
    },
    enabled: !!activeUnit?.id,
  });
};

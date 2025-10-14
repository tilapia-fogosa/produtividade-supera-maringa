import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ApostilaRecolhida {
  id: string;
  pessoa_nome: string;
  turma_nome: string;
  apostila: string;
  data_recolhida: string;
  data_entrega: string;
  pessoa_id: string;
}

export const useApostilasRecolhidas = () => {
  return useQuery({
    queryKey: ["apostilas-recolhidas"],
    queryFn: async () => {
      // Buscar apostilas recolhidas com informações das pessoas
      const { data: recolhidas, error } = await supabase
        .from("ah_recolhidas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Para cada recolhida, buscar informações da pessoa (aluno ou funcionário)
      const apostilasComDetalhes = await Promise.all(
        recolhidas.map(async (recolhida) => {
          // Tentar buscar como aluno
          const { data: aluno } = await supabase
            .from("alunos")
            .select("nome, turma_id, turmas(nome)")
            .eq("id", recolhida.pessoa_id)
            .single();

          if (aluno) {
            const dataRecolhida = new Date(recolhida.created_at);
            const dataEntrega = new Date(dataRecolhida);
            dataEntrega.setDate(dataEntrega.getDate() + 14);

            return {
              id: recolhida.id.toString(),
              pessoa_nome: aluno.nome,
              turma_nome: aluno.turmas?.nome || "Sem turma",
              apostila: recolhida.apostila,
              data_recolhida: recolhida.created_at,
              data_entrega: dataEntrega.toISOString(),
              pessoa_id: recolhida.pessoa_id,
            };
          }

          // Se não for aluno, tentar como funcionário
          const { data: funcionario } = await supabase
            .from("funcionarios")
            .select("nome, turma_id, turmas(nome)")
            .eq("id", recolhida.pessoa_id)
            .single();

          if (funcionario) {
            const dataRecolhida = new Date(recolhida.created_at);
            const dataEntrega = new Date(dataRecolhida);
            dataEntrega.setDate(dataEntrega.getDate() + 14);

            return {
              id: recolhida.id.toString(),
              pessoa_nome: funcionario.nome,
              turma_nome: funcionario.turmas?.nome || "Sem turma",
              apostila: recolhida.apostila,
              data_recolhida: recolhida.created_at,
              data_entrega: dataEntrega.toISOString(),
              pessoa_id: recolhida.pessoa_id,
            };
          }

          // Fallback se não encontrar
          const dataRecolhida = new Date(recolhida.created_at);
          const dataEntrega = new Date(dataRecolhida);
          dataEntrega.setDate(dataEntrega.getDate() + 14);

          return {
            id: recolhida.id.toString(),
            pessoa_nome: "Desconhecido",
            turma_nome: "Sem turma",
            apostila: recolhida.apostila,
            data_recolhida: recolhida.created_at,
            data_entrega: dataEntrega.toISOString(),
            pessoa_id: recolhida.pessoa_id,
          };
        })
      );

      return apostilasComDetalhes;
    },
  });
};

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AlunoIgnorado {
  id: string;
  pessoa_id: string;
  pessoa_tipo: string;
  nome_pessoa: string;
  turma_nome: string | null;
  data_inicio: string;
  data_fim: string;
  dias: number;
  motivo: string;
  responsavel: string;
  dias_restantes: number;
}

export const useAlunosIgnoradosAH = () => {
  return useQuery({
    queryKey: ['alunos-ignorados-ah'],
    queryFn: async () => {
      const dataAtual = new Date().toISOString();
      
      // Buscar registros ativos de ignorar coleta que ainda não expiraram
      const { data, error } = await supabase
        .from('ah_ignorar_coleta')
        .select('*')
        .eq('active', true)
        .gte('data_fim', dataAtual)
        .order('data_fim', { ascending: true });

      if (error) throw error;

      // Para cada registro, buscar informações da pessoa (aluno ou funcionário)
      const registrosComNomes = await Promise.all(
        (data || []).map(async (registro) => {
          let nomePessoa = 'Desconhecido';
          let turmaNome = null;

          if (registro.pessoa_tipo === 'aluno') {
            const { data: aluno } = await supabase
              .from('alunos')
              .select(`
                nome,
                turmas (nome)
              `)
              .eq('id', registro.pessoa_id)
              .single();
            
            if (aluno) {
              nomePessoa = aluno.nome;
              turmaNome = aluno.turmas?.nome || null;
            }
          } else if (registro.pessoa_tipo === 'funcionario') {
            const { data: funcionario } = await supabase
              .from('funcionarios')
              .select(`
                nome,
                turmas (nome)
              `)
              .eq('id', registro.pessoa_id)
              .single();
            
            if (funcionario) {
              nomePessoa = funcionario.nome;
              turmaNome = funcionario.turmas?.nome || null;
            }
          }

          // Calcular dias restantes
          const diasRestantes = Math.ceil(
            (new Date(registro.data_fim).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );

          return {
            id: registro.id,
            pessoa_id: registro.pessoa_id,
            pessoa_tipo: registro.pessoa_tipo,
            nome_pessoa: nomePessoa,
            turma_nome: turmaNome,
            data_inicio: registro.data_inicio,
            data_fim: registro.data_fim,
            dias: registro.dias,
            motivo: registro.motivo,
            responsavel: registro.responsavel,
            dias_restantes: diasRestantes
          };
        })
      );

      return registrosComNomes;
    },
  });
};

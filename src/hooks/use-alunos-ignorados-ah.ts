import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

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
  const { activeUnit } = useActiveUnit();

  return useQuery({
    queryKey: ['alunos-ignorados-ah', activeUnit?.id],
    queryFn: async () => {
      const dataAtual = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('ah_ignorar_coleta')
        .select('*')
        .eq('active', true)
        .gte('data_fim', dataAtual)
        .order('data_fim', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const alunoIds = data.filter(r => r.pessoa_tipo === 'aluno').map(r => r.pessoa_id);
      const funcIds = data.filter(r => r.pessoa_tipo === 'funcionario').map(r => r.pessoa_id);

      const [alunosRes, funcsRes] = await Promise.all([
        alunoIds.length > 0
          ? supabase.from('alunos').select('id, nome, turmas(nome)').in('id', alunoIds).eq('unit_id', activeUnit!.id)
          : Promise.resolve({ data: [] as any[], error: null }),
        funcIds.length > 0
          ? supabase.from('funcionarios').select('id, nome, turmas(nome)').in('id', funcIds).eq('unit_id', activeUnit!.id)
          : Promise.resolve({ data: [] as any[], error: null }),
      ]);

      const pessoasMap = new Map<string, { nome: string; turma_nome: string | null }>();
      (alunosRes.data || []).forEach((a: any) => pessoasMap.set(a.id, { nome: a.nome, turma_nome: a.turmas?.nome || null }));
      (funcsRes.data || []).forEach((f: any) => pessoasMap.set(f.id, { nome: f.nome, turma_nome: f.turmas?.nome || null }));

      return data
        .filter(r => pessoasMap.has(r.pessoa_id))
        .map(registro => {
          const pessoa = pessoasMap.get(registro.pessoa_id)!;
          const diasRestantes = Math.ceil(
            (new Date(registro.data_fim).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          return {
            id: registro.id,
            pessoa_id: registro.pessoa_id,
            pessoa_tipo: registro.pessoa_tipo,
            nome_pessoa: pessoa.nome,
            turma_nome: pessoa.turma_nome,
            data_inicio: registro.data_inicio,
            data_fim: registro.data_fim,
            dias: registro.dias,
            motivo: registro.motivo,
            responsavel: registro.responsavel,
            dias_restantes: diasRestantes,
          };
        }) as AlunoIgnorado[];
    },
    enabled: !!activeUnit?.id,
  });
};

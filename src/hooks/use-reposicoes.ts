import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format, addDays, getDay } from "date-fns";

interface ReposicaoData {
  aluno_id: string;
  turma_id: string;
  data_reposicao: string;
  data_falta?: string;
  responsavel_id: string;
  responsavel_tipo: 'professor' | 'funcionario';
  nome_responsavel: string;
  observacoes?: string;
  unit_id: string;
  created_by?: string;
}

export const useReposicoes = () => {
  const queryClient = useQueryClient();

  const criarReposicao = useMutation({
    mutationFn: async (data: ReposicaoData) => {
      const { data: result, error } = await supabase.functions.invoke('register-reposicao', {
        body: data
      });

      if (error) throw error;
      if (!result?.success) throw new Error(result?.error || 'Erro ao criar reposição');
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reposicoes'] });
      queryClient.invalidateQueries({ queryKey: ['calendario-turmas'] });
      toast({
        title: "Sucesso",
        description: "Reposição registrada com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Erro ao criar reposição:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar reposição. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    criarReposicao,
  };
};

// Função para calcular datas válidas baseadas no dia da semana da turma
export const calcularDatasValidas = (diaSemana: string): Date[] => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0); // Zerar horas para comparação correta
  const datas: Date[] = [];
  
  // Mapear dia da semana para número (domingo = 0, segunda = 1, etc.)
  const diasSemanaMap: { [key: string]: number } = {
    'domingo': 0,
    'segunda': 1,
    'terca': 2,
    'quarta': 3,
    'quinta': 4,
    'sexta': 5,
    'sabado': 6,
  };

  const diaAlvo = diasSemanaMap[diaSemana.toLowerCase()];
  if (diaAlvo === undefined) {
    console.error('Dia da semana inválido:', diaSemana);
    return [];
  }

  // Verificar se hoje é o dia da turma
  const diaHoje = getDay(hoje);
  
  // Se hoje é o dia da turma, incluir hoje como primeira opção
  if (diaHoje === diaAlvo) {
    datas.push(new Date(hoje));
  }

  // Encontrar a próxima data válida (próxima semana)
  let dataAtual = new Date(hoje);
  let diasParaProximaData = (diaAlvo - getDay(dataAtual) + 7) % 7;
  
  // Se é hoje, a próxima data será na próxima semana
  if (diasParaProximaData === 0) {
    diasParaProximaData = 7;
  }

  // Gerar as próximas 10 datas válidas (incluindo hoje se for o caso)
  const totalDatas = diaHoje === diaAlvo ? 9 : 10; // Se incluiu hoje, gerar 9 a mais
  for (let i = 0; i < totalDatas; i++) {
    const proximaData = addDays(dataAtual, diasParaProximaData + (i * 7));
    datas.push(proximaData);
  }

  return datas;
};
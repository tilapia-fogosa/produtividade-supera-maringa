
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, addDays } from 'date-fns';

export interface LembretesAluno {
  camisetaPendente: boolean;
  aniversarioHoje: boolean;
  aniversarioSemana: boolean;
  apostilaAHPronta: boolean;
}

export function useLembretesAlunos(alunoIds: string[]) {
  const [lembretes, setLembretes] = useState<Record<string, LembretesAluno>>({});
  const [loading, setLoading] = useState(false);

  const buscarLembretes = useCallback(async () => {
    if (alunoIds.length === 0) return;

    setLoading(true);
    try {
      const hoje = new Date();
      const hojeFormatado = format(hoje, 'dd/MM');
      
      // Gerar lista de datas da semana no formato DD/MM
      const inicioSemana = startOfWeek(hoje, { weekStartsOn: 0 });
      const datasSemana: string[] = [];
      for (let i = 0; i < 7; i++) {
        datasSemana.push(format(addDays(inicioSemana, i), 'dd/MM'));
      }
      
      // Buscar dados dos alunos (dias_supera e aniversario)
      const { data: alunosData } = await supabase
        .from('alunos')
        .select('id, dias_supera, aniversario_mes_dia')
        .in('id', alunoIds);

      // Buscar camisetas
      const { data: camisetasData } = await supabase
        .from('camisetas')
        .select('aluno_id, camiseta_entregue, nao_tem_tamanho')
        .in('aluno_id', alunoIds);

      // Buscar apostilas AH prontas para devolução (não entregues)
      const { data: ahRecolhidas } = await supabase
        .from('ah_recolhidas')
        .select('pessoa_id')
        .in('pessoa_id', alunoIds)
        .is('data_entrega_real', null);

      // Criar mapa de camisetas por aluno
      const camisetasMap = new Map(
        camisetasData?.map(c => [c.aluno_id, c]) || []
      );

      // Criar set de alunos com AH pronta
      const ahProntaSet = new Set(ahRecolhidas?.map(ah => ah.pessoa_id) || []);

      // Montar lembretes por aluno
      const lembretesMap: Record<string, LembretesAluno> = {};

      alunosData?.forEach(aluno => {
        const camiseta = camisetasMap.get(aluno.id);
        const diasSupera = aluno.dias_supera || 0;
        
        // Camiseta pendente: 60+ dias, não entregue, e não marcado como "não tem tamanho"
        const camisetaPendente = diasSupera >= 60 && 
          (!camiseta || (!camiseta.camiseta_entregue && !camiseta.nao_tem_tamanho));

        // Aniversário hoje
        const aniversarioHoje = aluno.aniversario_mes_dia === hojeFormatado;

        // Aniversário na semana
        const aniversarioSemana = datasSemana.includes(aluno.aniversario_mes_dia || '');

        // Apostila AH pronta para devolução
        const apostilaAHPronta = ahProntaSet.has(aluno.id);

        lembretesMap[aluno.id] = {
          camisetaPendente,
          aniversarioHoje,
          aniversarioSemana,
          apostilaAHPronta,
        };
      });

      setLembretes(lembretesMap);
    } catch (error) {
      console.error('[Lembretes] Erro ao buscar lembretes:', error);
    } finally {
      setLoading(false);
    }
  }, [alunoIds]);

  useEffect(() => {
    buscarLembretes();
  }, [buscarLembretes]);

  return { lembretes, loading };
}

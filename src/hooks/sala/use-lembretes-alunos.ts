
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, addDays } from 'date-fns';

export interface ApostilaAHPendente {
  recolhidaId: number;
  apostilaNome: string;
}

export interface BotomPendente {
  pendenciaId: string;
  apostilaNova: string;
}

export interface LembretesAluno {
  camisetaPendente: boolean;
  aniversarioHoje: boolean;
  aniversarioSemana: boolean;
  apostilaAHPronta: boolean;
  botomPendente: boolean;
  // Dados extras para ações interativas
  apostilaAHDados?: ApostilaAHPendente;
  botomDados?: BotomPendente;
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

      // Buscar apostilas AH prontas para devolução (não entregues) - COM dados completos
      const { data: ahRecolhidas } = await supabase
        .from('ah_recolhidas')
        .select('id, pessoa_id, apostila')
        .in('pessoa_id', alunoIds)
        .is('data_entrega_real', null);

      // Buscar pendências de botom
      const { data: botomPendencias } = await supabase
        .from('pendencias_botom')
        .select('id, aluno_id, apostila_nova')
        .in('aluno_id', alunoIds)
        .eq('status', 'pendente');

      // Criar mapa de camisetas por aluno
      const camisetasMap = new Map(
        camisetasData?.map(c => [c.aluno_id, c]) || []
      );

      // Criar mapa de apostilas AH pendentes (pegar a primeira se houver múltiplas)
      const ahPendentesMap = new Map<string, ApostilaAHPendente>();
      ahRecolhidas?.forEach(ah => {
        if (!ahPendentesMap.has(ah.pessoa_id)) {
          ahPendentesMap.set(ah.pessoa_id, {
            recolhidaId: ah.id,
            apostilaNome: ah.apostila
          });
        }
      });

      // Criar mapa de botom pendentes (pegar o primeiro se houver múltiplos)
      const botomPendentesMap = new Map<string, BotomPendente>();
      botomPendencias?.forEach(b => {
        if (!botomPendentesMap.has(b.aluno_id)) {
          botomPendentesMap.set(b.aluno_id, {
            pendenciaId: b.id,
            apostilaNova: b.apostila_nova
          });
        }
      });

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
        const apostilaAHDados = ahPendentesMap.get(aluno.id);
        const apostilaAHPronta = !!apostilaAHDados;

        // Botom pendente para entrega
        const botomDados = botomPendentesMap.get(aluno.id);
        const botomPendente = !!botomDados;

        lembretesMap[aluno.id] = {
          camisetaPendente,
          aniversarioHoje,
          aniversarioSemana,
          apostilaAHPronta,
          botomPendente,
          apostilaAHDados,
          botomDados,
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

  return { lembretes, loading, refetch: buscarLembretes };
}

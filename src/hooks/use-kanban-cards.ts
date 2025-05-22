import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { startOfMonth, startOfYear, subMonths, subYears, format } from 'date-fns';

interface KanbanCard {
  id: string;
  alerta_evasao_id: string;
  column_id: string;  // 'todo' | 'doing' | 'scheduled' | 'done' | 'hibernating'
  title: string;
  description: string | null;
  aluno_nome: string | null;
  origem: string | null;
  responsavel: string | null;
  created_at: string;
  updated_at: string;
  historico?: string | null;
  priority?: string;
  due_date?: string | null;
  attached_files?: any[];
  comments?: any[];
  tags?: string[];
  last_activity?: string;
  retention_date?: string | null;
  resultado?: 'evadiu' | 'retido' | null;
  
  // Campos comuns
  turma?: string | null;
  educador?: string | null;
  fez_pausa_emergencial?: boolean;
  faltas_recorrentes?: boolean;
  
  // Campos específicos para alertas ativos
  link_ficha_rescisao?: string | null;
  
  // Campos específicos para Evadidos
  data_evasao?: string | null;
  data_rescisao?: string | null;
  data_exclusao_sgs?: string | null;
  motivo_evasao?: string | null;
  exclusao_sgs_confirmada?: boolean;
  exclusao_whatsapp_confirmada?: boolean;
  
  // Campos específicos para Retidos
  data_retencao_confirmada?: string | null;
  acao_retencao?: string | null;
  acordo_retencao?: string | null;
  
  // Observações para retidos e evadidos
  observacoes_adicionais?: string | null;
}

interface ResultadoPeriodo {
  periodo: string;
  total: number;
  evadidos: number;
  retidos: number;
  percentualRetencao: number;
  comparacaoAnterior?: {
    total: number;
    evadidos: number;
    retidos: number;
    percentualRetencao: number;
    diferencaPercentual: number;
  };
  comparacaoAnoAnterior?: {
    total: number;
    evadidos: number;
    retidos: number;
    percentualRetencao: number;
    diferencaPercentual: number;
  };
}

export const useKanbanCards = (showHibernating: boolean = false) => {
  const queryClient = useQueryClient();

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['kanban-cards', { showHibernating }],
    queryFn: async () => {
      let query = supabase
        .from('kanban_cards')
        .select('*');

      if (showHibernating) {
        query = query.eq('column_id', 'hibernating');
      } else {
        query = query.neq('column_id', 'hibernating');
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar cards:', error);
        throw error;
      }

      console.log('Cards carregados:', data);
      return data as KanbanCard[];
    }
  });

  const updateCardColumn = useMutation({
    mutationFn: async ({ cardId, newColumnId }: { cardId: string; newColumnId: string }) => {
      console.log(`Atualizando card ${cardId} para coluna ${newColumnId}`);
      
      const { error, data } = await supabase
        .from('kanban_cards')
        .update({ column_id: newColumnId })
        .eq('id', cardId)
        .select();

      if (error) {
        console.error('Erro ao atualizar coluna:', error);
        throw error;
      }
      
      console.log('Atualização concluída:', data);
      return data;
    },
    onSuccess: () => {
      console.log('Invalidando cache após atualização de coluna');
      queryClient.invalidateQueries({ queryKey: ['kanban-cards'] });
    },
    onError: (error) => {
      console.error('Erro na mutação de atualização de coluna:', error);
    }
  });

  const updateCard = useMutation({
    mutationFn: async (updateData: { 
      cardId: string; 
      title: string;
      description: string;
      responsavel: string;
      priority?: string;
      due_date?: string | null;
      tags?: string[];
      column_id?: string;
      historico?: string | null;
      turma?: string;
      educador?: string;
      fez_pausa_emergencial?: boolean;
      faltas_recorrentes?: boolean;
      link_ficha_rescisao?: string;
      data_evasao?: string;
      data_rescisao?: string;
      data_exclusao_sgs?: string;
      motivo_evasao?: string;
      exclusao_sgs_confirmada?: boolean;
      exclusao_whatsapp_confirmada?: boolean;
      data_retencao_confirmada?: string;
      acao_retencao?: string;
      acordo_retencao?: string;
      observacoes_adicionais?: string;
    }) => {
      console.log('Atualizando card:', updateData);
      
      const { cardId, ...dataToUpdate } = updateData;
      
      const { error, data } = await supabase
        .from('kanban_cards')
        .update(dataToUpdate)
        .eq('id', cardId)
        .select();

      if (error) {
        console.error('Erro ao atualizar card:', error);
        throw error;
      }
      
      console.log('Card atualizado:', data);
      return data;
    },
    onSuccess: () => {
      console.log('Invalidando cache após atualização de card');
      queryClient.invalidateQueries({ queryKey: ['kanban-cards'] });
    },
    onError: (error) => {
      console.error('Erro na mutação de atualização de card:', error);
    }
  });

  // Nova mutação para atualizar campos de status
  const updateCardStatus = useMutation({
    mutationFn: async ({ 
      cardId, 
      field, 
      value 
    }: { 
      cardId: string; 
      field: string;
      value: boolean | string | null;
    }) => {
      console.log(`Atualizando status do card ${cardId}, campo ${field}:`, value);
      
      const { error, data } = await supabase
        .from('kanban_cards')
        .update({ [field]: value })
        .eq('id', cardId)
        .select();

      if (error) {
        console.error('Erro ao atualizar status do card:', error);
        throw error;
      }
      
      console.log('Status atualizado:', data);
      return data;
    },
    onSuccess: () => {
      console.log('Invalidando cache após atualização de status');
      queryClient.invalidateQueries({ queryKey: ['kanban-cards'] });
      toast.success("Status atualizado com sucesso");
    },
    onError: (error) => {
      console.error('Erro na mutação de atualização de status:', error);
      toast.error("Erro ao atualizar status");
    }
  });

  const finalizarAlerta = useMutation({
    mutationFn: async ({ 
      cardId, 
      alertaId, 
      resultado, 
      alunoNome 
    }: { 
      cardId: string; 
      alertaId: string; 
      resultado: 'evadiu' | 'retido';
      alunoNome?: string | null;
    }) => {
      console.log(`Finalizando alerta ${alertaId} com resultado: ${resultado}`);
      
      const dataHora = new Date().toLocaleString('pt-BR');
      const mensagemHistorico = `${dataHora} - Alerta finalizado como: ${resultado === 'evadiu' ? 'EVADIDO' : 'RETIDO'}`;
      
      // Primeiro, busca o card atual para obter o histórico existente
      const { data: cardAtual, error: erroCard } = await supabase
        .from('kanban_cards')
        .select('historico')
        .eq('id', cardId)
        .single();
        
      if (erroCard) {
        console.error('Erro ao buscar card para finalização:', erroCard);
        throw erroCard;
      }
      
      // Atualiza o histórico concatenando a nova mensagem
      const historicoAtualizado = cardAtual.historico 
        ? `${cardAtual.historico}\n\n${mensagemHistorico}` 
        : mensagemHistorico;
      
      // Prepara dados adicionais baseados no tipo de resultado
      const dadosAdicionais = resultado === 'evadiu' 
        ? { 
            data_evasao: new Date().toISOString(),
          } 
        : { 
            data_retencao_confirmada: new Date().toISOString(), 
          };
      
      // Atualiza o card com o resultado e o histórico
      const { error: errorCard } = await supabase
        .from('kanban_cards')
        .update({ 
          resultado,
          historico: historicoAtualizado,
          column_id: 'done', // Move para coluna "Concluído"
          ...dadosAdicionais
        })
        .eq('id', cardId);

      if (errorCard) {
        console.error('Erro ao finalizar card:', errorCard);
        throw errorCard;
      }
      
      // Atualiza o alerta na tabela alerta_evasao
      const { error: errorAlerta } = await supabase
        .from('alerta_evasao')
        .update({ 
          status: 'resolvido',
          kanban_status: 'done'
        })
        .eq('id', alertaId);

      if (errorAlerta) {
        console.error('Erro ao atualizar alerta de evasão:', errorAlerta);
        throw errorAlerta;
      }
      
      return { resultado, alunoNome };
    },
    onSuccess: (data) => {
      console.log('Alerta finalizado com sucesso:', data);
      const mensagem = data.resultado === 'evadiu' 
        ? `${data.alunoNome || 'Aluno'} marcado como evadido`
        : `${data.alunoNome || 'Aluno'} marcado como retido`;
      
      toast.success(mensagem);
      queryClient.invalidateQueries({ queryKey: ['kanban-cards'] });
      queryClient.invalidateQueries({ queryKey: ['resultados-evasao'] });
    },
    onError: (error) => {
      console.error('Erro ao finalizar alerta:', error);
      toast.error('Erro ao finalizar o alerta');
    }
  });

  // Nova função para obter estatísticas de resultados por períodos
  const useResultadosEvasao = () => {
    return useQuery({
      queryKey: ['resultados-evasao'],
      queryFn: async () => {
        const agora = new Date();
        
        // Definir períodos
        const inicioMesAtual = startOfMonth(agora);
        const inicioMesAnterior = startOfMonth(subMonths(agora, 1));
        const inicioMesAnoAnterior = startOfMonth(subYears(agora, 1));
        
        const inicioTrimestreAtual = startOfMonth(subMonths(agora, 2));
        const inicioTrimestreAnterior = startOfMonth(subMonths(agora, 5));
        const inicioTrimestreAnoAnterior = startOfMonth(subYears(subMonths(agora, 2), 1));
        
        const inicioSemestreAtual = startOfMonth(subMonths(agora, 5));
        const inicioSemestreAnterior = startOfMonth(subMonths(agora, 11));
        const inicioSemestreAnoAnterior = startOfMonth(subYears(subMonths(agora, 5), 1));
        
        const inicioAnoAtual = startOfYear(agora);
        const inicioAnoAnterior = startOfYear(subYears(agora, 1));
        const inicioAnoRetrasado = startOfYear(subYears(agora, 2));
        
        // Buscar cards finalizados
        const { data: todosCards, error } = await supabase
          .from('kanban_cards')
          .select('*')
          .not('resultado', 'is', null);
          
        if (error) {
          console.error('Erro ao buscar cards para estatísticas:', error);
          throw error;
        }
        
        const cardsComData = todosCards.map(card => ({
          ...card,
          dataObj: new Date(card.updated_at)
        }));
        
        // Função para calcular estatísticas para um período
        const calcularEstatisticas = (cards: any[], dataInicio: Date, dataFim: Date = agora) => {
          const cardsDoPeriodo = cards.filter(card => 
            card.dataObj >= dataInicio && card.dataObj <= dataFim);
            
          const total = cardsDoPeriodo.length;
          const evadidos = cardsDoPeriodo.filter(card => card.resultado === 'evadiu').length;
          const retidos = cardsDoPeriodo.filter(card => card.resultado === 'retido').length;
          const percentualRetencao = total > 0 ? (retidos / total) * 100 : 0;
          
          return {
            total,
            evadidos,
            retidos,
            percentualRetencao: Math.round(percentualRetencao * 10) / 10 // arredondar para 1 casa decimal
          };
        };
        
        // Calcular estatísticas para cada período
        const estatisticasMesAtual = calcularEstatisticas(cardsComData, inicioMesAtual);
        const estatisticasMesAnterior = calcularEstatisticas(cardsComData, inicioMesAnterior, inicioMesAtual);
        const estatisticasMesAnoAnterior = calcularEstatisticas(
          cardsComData, 
          inicioMesAnoAnterior,
          new Date(inicioMesAnoAnterior.getFullYear(), inicioMesAnoAnterior.getMonth() + 1, 0)
        );
        
        const estatisticasTrimestreAtual = calcularEstatisticas(cardsComData, inicioTrimestreAtual);
        const estatisticasTrimestreAnterior = calcularEstatisticas(cardsComData, inicioTrimestreAnterior, inicioTrimestreAtual);
        const estatisticasTrimestreAnoAnterior = calcularEstatisticas(
          cardsComData, 
          inicioTrimestreAnoAnterior,
          new Date(inicioTrimestreAnoAnterior.getFullYear(), inicioTrimestreAnoAnterior.getMonth() + 3, 0)
        );
        
        const estatisticasSemestreAtual = calcularEstatisticas(cardsComData, inicioSemestreAtual);
        const estatisticasSemestreAnterior = calcularEstatisticas(cardsComData, inicioSemestreAnterior, inicioSemestreAtual);
        const estatisticasSemestreAnoAnterior = calcularEstatisticas(
          cardsComData, 
          inicioSemestreAnoAnterior,
          new Date(inicioSemestreAnoAnterior.getFullYear(), inicioSemestreAnoAnterior.getMonth() + 6, 0)
        );
        
        const estatisticasAnoAtual = calcularEstatisticas(cardsComData, inicioAnoAtual);
        const estatisticasAnoAnterior = calcularEstatisticas(cardsComData, inicioAnoAnterior, inicioAnoAtual);
        
        // Calcular diferenças percentuais
        const calcularDiferencaPercentual = (atual: number, anterior: number) => {
          if (anterior === 0) return atual > 0 ? 100 : 0;
          return Math.round(((atual - anterior) / anterior) * 100);
        };
        
        // Montar objeto de retorno
        const resultados: ResultadoPeriodo[] = [
          {
            periodo: `Mês (${format(inicioMesAtual, 'MMM/yyyy')})`,
            ...estatisticasMesAtual,
            comparacaoAnterior: {
              ...estatisticasMesAnterior,
              diferencaPercentual: calcularDiferencaPercentual(
                estatisticasMesAtual.percentualRetencao, 
                estatisticasMesAnterior.percentualRetencao
              )
            },
            comparacaoAnoAnterior: {
              ...estatisticasMesAnoAnterior,
              diferencaPercentual: calcularDiferencaPercentual(
                estatisticasMesAtual.percentualRetencao, 
                estatisticasMesAnoAnterior.percentualRetencao
              )
            }
          },
          {
            periodo: `Trimestre (${format(inicioTrimestreAtual, 'MMM')}-${format(agora, 'MMM/yyyy')})`,
            ...estatisticasTrimestreAtual,
            comparacaoAnterior: {
              ...estatisticasTrimestreAnterior,
              diferencaPercentual: calcularDiferencaPercentual(
                estatisticasTrimestreAtual.percentualRetencao, 
                estatisticasTrimestreAnterior.percentualRetencao
              )
            },
            comparacaoAnoAnterior: {
              ...estatisticasTrimestreAnoAnterior,
              diferencaPercentual: calcularDiferencaPercentual(
                estatisticasTrimestreAtual.percentualRetencao, 
                estatisticasTrimestreAnoAnterior.percentualRetencao
              )
            }
          },
          {
            periodo: `Semestre (${format(inicioSemestreAtual, 'MMM')}-${format(agora, 'MMM/yyyy')})`,
            ...estatisticasSemestreAtual,
            comparacaoAnterior: {
              ...estatisticasSemestreAnterior,
              diferencaPercentual: calcularDiferencaPercentual(
                estatisticasSemestreAtual.percentualRetencao, 
                estatisticasSemestreAnterior.percentualRetencao
              )
            },
            comparacaoAnoAnterior: {
              ...estatisticasSemestreAnoAnterior,
              diferencaPercentual: calcularDiferencaPercentual(
                estatisticasSemestreAtual.percentualRetencao, 
                estatisticasSemestreAnoAnterior.percentualRetencao
              )
            }
          },
          {
            periodo: `Ano (${format(inicioAnoAtual, 'yyyy')})`,
            ...estatisticasAnoAtual,
            comparacaoAnterior: {
              ...estatisticasAnoAnterior,
              diferencaPercentual: calcularDiferencaPercentual(
                estatisticasAnoAtual.percentualRetencao, 
                estatisticasAnoAnterior.percentualRetencao
              )
            }
          }
        ];
        
        return resultados;
      }
    });
  };

  return {
    cards,
    isLoading,
    updateCardColumn,
    updateCard,
    updateCardStatus,
    finalizarAlerta,
    useResultadosEvasao
  };
};

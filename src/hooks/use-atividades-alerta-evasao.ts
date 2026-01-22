import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentFuncionario } from '@/hooks/use-current-funcionario';

export type TipoAtividadeEvasao = 
  | 'acolhimento'
  | 'atendimento_financeiro'
  | 'evasao'
  | 'atendimento_pedagogico'
  | 'retencao'
  // Novos tipos - tarefas administrativas
  | 'remover_sgs'
  | 'cancelar_assinatura'
  | 'remover_whatsapp'
  | 'corrigir_valores_sgs'
  | 'corrigir_valores_assinatura';

export type StatusAtividade = 'pendente' | 'concluida';

export interface AtividadeAlertaEvasao {
  id: string;
  alerta_evasao_id: string;
  tipo_atividade: TipoAtividadeEvasao;
  descricao: string;
  responsavel_id: string | null;
  responsavel_nome: string | null;
  created_at: string;
  status: StatusAtividade;
  departamento_responsavel: string | null;
  professor_responsavel_id: string | null;
  concluido_por_id: string | null;
  concluido_por_nome: string | null;
  data_agendada: string | null;
}

// Tipos permitidos ao gerar nova atividade a partir de acolhimento
export const TIPOS_PERMITIDOS_APOS_ACOLHIMENTO: TipoAtividadeEvasao[] = [
  'atendimento_financeiro',
  'atendimento_pedagogico',
  'acolhimento',
  'retencao'
];

export const TIPOS_ATIVIDADE: { value: TipoAtividadeEvasao; label: string; color: string }[] = [
  { value: 'acolhimento', label: 'Acolhimento', color: 'bg-blue-500' },
  { value: 'atendimento_financeiro', label: 'Negociação Financeira', color: 'bg-purple-500' },
  { value: 'evasao', label: 'Evasão', color: 'bg-red-500' },
  { value: 'atendimento_pedagogico', label: 'Atendimento Pedagógico', color: 'bg-orange-500' },
  { value: 'retencao', label: 'Retenção', color: 'bg-green-500' },
  // Novos tipos administrativos
  { value: 'remover_sgs', label: 'Remover do SGS', color: 'bg-red-400' },
  { value: 'cancelar_assinatura', label: 'Cancelar Assinatura', color: 'bg-red-400' },
  { value: 'remover_whatsapp', label: 'Remover WhatsApp', color: 'bg-red-400' },
  { value: 'corrigir_valores_sgs', label: 'Corrigir SGS', color: 'bg-yellow-500' },
  { value: 'corrigir_valores_assinatura', label: 'Corrigir Assinatura', color: 'bg-yellow-500' },
];

// Busca professor da turma do aluno associado ao alerta
async function buscarProfessorDaTurma(alertaId: string): Promise<{ id: string; nome: string } | null> {
  const { data, error } = await supabase
    .from('alerta_evasao')
    .select(`
      alunos!inner(
        turma_id,
        turmas!inner(
          professor_id,
          professores!inner(id, nome)
        )
      )
    `)
    .eq('id', alertaId)
    .single();
  
  if (error || !data) return null;
  
  // Navegar pela estrutura aninhada
  const alunos = data.alunos as any;
  const turmas = alunos?.turmas;
  const professores = turmas?.professores;
  
  if (professores?.id && professores?.nome) {
    return { id: professores.id, nome: professores.nome };
  }
  
  return null;
}

export function useAtividadesAlertaEvasao(alertaEvasaoId: string | null) {
  const queryClient = useQueryClient();
  const { funcionarioNome } = useCurrentFuncionario();

  const { data: atividades = [], isLoading, error } = useQuery({
    queryKey: ['atividades-alerta-evasao', alertaEvasaoId],
    queryFn: async () => {
      if (!alertaEvasaoId) return [];
      
      const { data, error } = await supabase
        .from('atividades_alerta_evasao')
        .select('*')
        .eq('alerta_evasao_id', alertaEvasaoId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as AtividadeAlertaEvasao[];
    },
    enabled: !!alertaEvasaoId,
  });

  const criarAtividadeMutation = useMutation({
    mutationFn: async ({ 
      tipo_atividade, 
      descricao,
      atividadeAnteriorId,
      data_agendada,
      horario_agendado,
      professor_id_agendamento
    }: { 
      tipo_atividade: TipoAtividadeEvasao; 
      descricao: string;
      atividadeAnteriorId?: string;
      data_agendada?: string;
      horario_agendado?: string;
      professor_id_agendamento?: string;
    }) => {
      if (!alertaEvasaoId) throw new Error('Alerta ID não fornecido');
      
      const { data: { user } } = await supabase.auth.getUser();
      
      // Se tem atividade anterior, marca ela como concluída e registra quem concluiu
      if (atividadeAnteriorId) {
        const { error: updateError } = await supabase
          .from('atividades_alerta_evasao')
          .update({ 
            status: 'concluida',
            concluido_por_id: user?.id || null,
            concluido_por_nome: funcionarioNome || user?.email || 'Usuário'
          })
          .eq('id', atividadeAnteriorId);
        
        if (updateError) throw updateError;
      }
      
      // Determinar responsável baseado no tipo
      let departamento_responsavel: string | null = null;
      let professor_responsavel_id: string | null = null;
      let responsavel_nome: string | null = funcionarioNome || user?.email || 'Usuário';
      
      // Tipos terminais: retenção (evasão agora gera tarefas admin)
      const isTerminalRetencao = tipo_atividade === 'retencao';
      const isEvasaoComTarefas = tipo_atividade === 'evasao';
      
      // Tipos administrativos
      const isAdministrativo = [
        'atendimento_financeiro',
        'remover_sgs',
        'cancelar_assinatura',
        'remover_whatsapp',
        'corrigir_valores_sgs',
        'corrigir_valores_assinatura'
      ].includes(tipo_atividade);
      
      if (isAdministrativo) {
        // Tarefas administrativas → Departamento Administrativo
        departamento_responsavel = 'administrativo';
        responsavel_nome = 'Administrativo';
      } else if (['acolhimento', 'atendimento_pedagogico'].includes(tipo_atividade)) {
        // Acolhimento / Atendimento Pedagógico → Professor da turma
        const professor = await buscarProfessorDaTurma(alertaEvasaoId);
        if (professor) {
          professor_responsavel_id = professor.id;
          responsavel_nome = professor.nome;
        }
      }
      
      // Para evasão, não criamos a atividade evasão diretamente
      // Criamos as tarefas administrativas que, ao serem concluídas, geram a evasão
      if (isEvasaoComTarefas) {
        // Criar as 2 tarefas administrativas
        const tarefasEvasao = [
          { tipo: 'cancelar_assinatura' as TipoAtividadeEvasao, descricao: 'Cancelar assinatura no Vindi ou Asaas' },
          { tipo: 'remover_sgs' as TipoAtividadeEvasao, descricao: 'Remover aluno do sistema SGS' }
        ];
        
        for (const tarefa of tarefasEvasao) {
          const tarefaData = {
            alerta_evasao_id: alertaEvasaoId,
            tipo_atividade: tarefa.tipo as any,
            descricao: tarefa.descricao,
            responsavel_id: user?.id || null,
            responsavel_nome: 'Administrativo',
            status: 'pendente',
            departamento_responsavel: 'administrativo'
          };
          
          const { error: insertError } = await supabase
            .from('atividades_alerta_evasao')
            .insert(tarefaData as any);
          
          if (insertError) throw insertError;
        }
        
        // Marcar atividade anterior como concluída se houver
        // (já foi feito no início, retorna sem criar atividade de evasão)
        return { id: 'tarefas_criadas', tipo_atividade: 'evasao' };
      }
      
      // Cria a nova atividade
      const insertData = {
        alerta_evasao_id: alertaEvasaoId,
        tipo_atividade: tipo_atividade as any,
        descricao,
        responsavel_id: user?.id || null,
        responsavel_nome,
        status: isTerminalRetencao ? 'concluida' : 'pendente',
        departamento_responsavel,
        professor_responsavel_id,
        data_agendada: data_agendada || null,
        // Se for retenção, já marca quem concluiu
        concluido_por_id: isTerminalRetencao ? (user?.id || null) : null,
        concluido_por_nome: isTerminalRetencao ? (funcionarioNome || user?.email || 'Usuário') : null
      };
      
      const { data, error } = await supabase
        .from('atividades_alerta_evasao')
        .insert(insertData as any)
        .select()
        .single();
      
      if (error) throw error;
      
      // Se for retenção, resolve o alerta
      if (isTerminalRetencao) {
        const { error: alertaError } = await supabase
          .from('alerta_evasao')
          .update({ 
            status: 'resolvido',
            updated_at: new Date().toISOString()
          })
          .eq('id', alertaEvasaoId);
        
        if (alertaError) throw alertaError;
      }

      // Se for atendimento pedagógico com agendamento, criar evento na agenda do professor
      if (tipo_atividade === 'atendimento_pedagogico' && data_agendada && horario_agendado) {
        const professorId = professor_id_agendamento || professor_responsavel_id;
        
        if (professorId) {
          // Buscar nome do aluno para o título do evento
          const { data: alertaData } = await supabase
            .from('alerta_evasao')
            .select('alunos(nome)')
            .eq('id', alertaEvasaoId)
            .single();
          
          const nomeAluno = (alertaData?.alunos as any)?.nome || 'Aluno';
          
          // Calcular horário fim (1 hora depois)
          const [horas, minutos] = horario_agendado.split(':').map(Number);
          const totalMinutos = horas * 60 + minutos + 60; // +60 minutos
          const horasFim = Math.floor(totalMinutos / 60);
          const minutosFim = totalMinutos % 60;
          const horarioFim = `${String(horasFim).padStart(2, '0')}:${String(minutosFim).padStart(2, '0')}`;
          
          // Criar evento na agenda do professor
          const eventoData = {
            professor_id: professorId,
            tipo_evento: 'atendimento_individual',
            titulo: `Atend. Pedagógico - ${nomeAluno}`,
            descricao: descricao,
            data: data_agendada,
            horario_inicio: horario_agendado,
            horario_fim: horarioFim,
            recorrente: false,
            created_by: user?.id || null
          };
          
          const { error: eventoError } = await supabase
            .from('eventos_professor')
            .insert(eventoData);
          
          if (eventoError) {
            console.error('Erro ao criar evento na agenda:', eventoError);
            // Não lançamos erro para não desfazer a atividade criada
          }
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atividades-alerta-evasao', alertaEvasaoId] });
      queryClient.invalidateQueries({ queryKey: ['alertas-evasao-lista'] });
    },
  });

  // Mutation para processar resultado da negociação financeira
  const processarNegociacaoMutation = useMutation({
    mutationFn: async ({ 
      resultado,
      atividadeAnteriorId,
      dataFimAjuste,
      observacoes
    }: { 
      resultado: 'evasao' | 'ajuste_temporario' | 'ajuste_definitivo';
      atividadeAnteriorId: string;
      dataFimAjuste?: Date;
      observacoes?: string;
    }) => {
      if (!alertaEvasaoId) throw new Error('Alerta ID não fornecido');
      
      const { data: { user } } = await supabase.auth.getUser();
      
      // Marca a negociação financeira como concluída com observações
      const updateData: any = { 
        status: 'concluida',
        concluido_por_id: user?.id || null,
        concluido_por_nome: funcionarioNome || user?.email || 'Usuário'
      };
      
      // Atualiza a descrição da atividade com as observações se fornecidas
      if (observacoes) {
        // Busca a descrição original para concatenar
        const { data: atividadeOriginal } = await supabase
          .from('atividades_alerta_evasao')
          .select('descricao')
          .eq('id', atividadeAnteriorId)
          .single();
        
        if (atividadeOriginal) {
          updateData.descricao = `${atividadeOriginal.descricao}\n\nObservações: ${observacoes}`;
        }
      }
      
      const { error: updateError } = await supabase
        .from('atividades_alerta_evasao')
        .update(updateData)
        .eq('id', atividadeAnteriorId);
      
      if (updateError) throw updateError;

      // Definir tarefas a serem criadas baseado no resultado
      interface TarefaAdmin {
        tipo: TipoAtividadeEvasao;
        descricao: string;
        data_agendada?: string;
      }
      
      let tarefas: TarefaAdmin[] = [];
      let deveResolverAlerta = false;
      
      if (resultado === 'evasao') {
        // Evasão: 3 tarefas administrativas
        tarefas = [
          { tipo: 'remover_sgs', descricao: 'Remover aluno do sistema SGS' },
          { tipo: 'cancelar_assinatura', descricao: 'Cancelar assinatura no Vindi ou Asaas' },
          { tipo: 'remover_whatsapp', descricao: 'Remover aluno dos grupos de WhatsApp' }
        ];
        // O alerta só será resolvido quando TODAS as tarefas forem concluídas
      } else if (resultado === 'ajuste_temporario' && dataFimAjuste) {
        // Ajuste temporário: 2 tarefas imediatas + 1 agendada
        const dataFormatada = dataFimAjuste.toISOString().split('T')[0];
        tarefas = [
          { tipo: 'corrigir_valores_sgs', descricao: 'Corrigir valores no SGS' },
          { tipo: 'corrigir_valores_assinatura', descricao: 'Corrigir valores da assinatura Vindi/Asaas' },
          { 
            tipo: 'atendimento_financeiro', 
            descricao: `Nova negociação financeira agendada para ${new Date(dataFimAjuste).toLocaleDateString('pt-BR')}`,
            data_agendada: dataFormatada
          }
        ];
      } else if (resultado === 'ajuste_definitivo') {
        // Ajuste definitivo: 2 tarefas + resolve o alerta
        tarefas = [
          { tipo: 'corrigir_valores_sgs', descricao: 'Corrigir valores no SGS' },
          { tipo: 'corrigir_valores_assinatura', descricao: 'Corrigir valores da assinatura Vindi/Asaas' }
        ];
        
        // Também cria a atividade de retenção para registrar o sucesso
        const retencaoData = {
          alerta_evasao_id: alertaEvasaoId,
          tipo_atividade: 'retencao' as any,
          descricao: 'Aluno retido com sucesso através de ajuste definitivo de valores',
          responsavel_id: user?.id || null,
          responsavel_nome: funcionarioNome || user?.email || 'Usuário',
          status: 'concluida',
          concluido_por_id: user?.id || null,
          concluido_por_nome: funcionarioNome || user?.email || 'Usuário'
        };
        
        const { error: retencaoError } = await supabase
          .from('atividades_alerta_evasao')
          .insert(retencaoData as any);
        
        if (retencaoError) throw retencaoError;
        deveResolverAlerta = true;
      }
      
      // Criar todas as tarefas
      for (const tarefa of tarefas) {
        const tarefaData = {
          alerta_evasao_id: alertaEvasaoId,
          tipo_atividade: tarefa.tipo as any,
          descricao: tarefa.descricao,
          responsavel_id: user?.id || null,
          responsavel_nome: 'Administrativo',
          status: 'pendente',
          departamento_responsavel: 'administrativo',
          data_agendada: tarefa.data_agendada || null
        };
        
        const { error: insertError } = await supabase
          .from('atividades_alerta_evasao')
          .insert(tarefaData as any);
        
        if (insertError) throw insertError;
      }
      
      // Se for ajuste definitivo, resolver o alerta
      if (deveResolverAlerta) {
        const { error: alertaError } = await supabase
          .from('alerta_evasao')
          .update({ 
            status: 'resolvido',
            updated_at: new Date().toISOString()
          })
          .eq('id', alertaEvasaoId);
        
        if (alertaError) throw alertaError;
      }
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atividades-alerta-evasao', alertaEvasaoId] });
      queryClient.invalidateQueries({ queryKey: ['alertas-evasao-lista'] });
    },
  });

  // Mutation para concluir uma tarefa administrativa simples
  const concluirTarefaMutation = useMutation({
    mutationFn: async (atividadeId: string) => {
      if (!alertaEvasaoId) throw new Error('Alerta ID não fornecido');
      
      const { data: { user } } = await supabase.auth.getUser();
      
      // Marca a atividade como concluída
      const { error: updateError } = await supabase
        .from('atividades_alerta_evasao')
        .update({ 
          status: 'concluida',
          concluido_por_id: user?.id || null,
          concluido_por_nome: funcionarioNome || user?.email || 'Usuário'
        })
        .eq('id', atividadeId);
      
      if (updateError) throw updateError;
      
      // Verificar se todas as tarefas de evasão foram concluídas
      const { data: todasAtividades, error: fetchError } = await supabase
        .from('atividades_alerta_evasao')
        .select('*')
        .eq('alerta_evasao_id', alertaEvasaoId);
      
      if (fetchError) throw fetchError;
      
      // Verificar se há uma evasão registrada e todas as tarefas relacionadas foram concluídas
      const tarefasEvasao = ['remover_sgs', 'cancelar_assinatura', 'remover_whatsapp'];
      const temTarefasEvasao = todasAtividades?.some(a => tarefasEvasao.includes(a.tipo_atividade));
      
      if (temTarefasEvasao) {
        const todasTarefasEvasaoConcluidas = tarefasEvasao.every(tipo => {
          const tarefa = todasAtividades?.find(a => a.tipo_atividade === tipo);
          return tarefa?.status === 'concluida';
        });
        
        if (todasTarefasEvasaoConcluidas) {
          // Criar registro de evasão
          const evasaoData = {
            alerta_evasao_id: alertaEvasaoId,
            tipo_atividade: 'evasao' as any,
            descricao: 'Processo de evasão concluído - todas as tarefas administrativas finalizadas',
            responsavel_id: user?.id || null,
            responsavel_nome: funcionarioNome || user?.email || 'Usuário',
            status: 'concluida',
            concluido_por_id: user?.id || null,
            concluido_por_nome: funcionarioNome || user?.email || 'Usuário'
          };
          
          const { error: evasaoError } = await supabase
            .from('atividades_alerta_evasao')
            .insert(evasaoData as any);
          
          if (evasaoError) throw evasaoError;
          
          // Resolver o alerta
          const { error: alertaError } = await supabase
            .from('alerta_evasao')
            .update({ 
              status: 'resolvido',
              updated_at: new Date().toISOString()
            })
            .eq('id', alertaEvasaoId);
          
          if (alertaError) throw alertaError;
        }
      }
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atividades-alerta-evasao', alertaEvasaoId] });
      queryClient.invalidateQueries({ queryKey: ['alertas-evasao-lista'] });
    },
  });

  return {
    atividades,
    isLoading,
    error,
    criarAtividade: criarAtividadeMutation.mutateAsync,
    isCriando: criarAtividadeMutation.isPending,
    processarNegociacao: processarNegociacaoMutation.mutateAsync,
    isProcessandoNegociacao: processarNegociacaoMutation.isPending,
    concluirTarefa: concluirTarefaMutation.mutateAsync,
    isConcluindoTarefa: concluirTarefaMutation.isPending,
  };
}

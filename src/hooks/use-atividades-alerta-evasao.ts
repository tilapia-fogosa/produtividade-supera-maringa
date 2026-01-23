import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentFuncionario } from '@/hooks/use-current-funcionario';
import { format } from 'date-fns';

export type TipoAtividadeEvasao = 
  | 'acolhimento'
  | 'contato_financeiro'
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
  'contato_financeiro',
  'atendimento_pedagogico',
  'acolhimento',
  'retencao'
];

export const TIPOS_ATIVIDADE: { value: TipoAtividadeEvasao; label: string; color: string }[] = [
  { value: 'acolhimento', label: 'Acolhimento', color: 'bg-blue-500' },
  { value: 'contato_financeiro', label: 'Contato Financeiro', color: 'bg-indigo-500' },
  { value: 'atendimento_financeiro', label: 'Atendimento Financeiro', color: 'bg-purple-500' },
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

const WEBHOOK_URL = 'https://webhookn8n.agenciakadin.com.br/webhook/alertas-evasao-slack';

// Função para buscar usuários de um departamento
async function buscarUsuariosDoDepartamento(departamento: string): Promise<Array<{ id: string; nome: string; email: string }>> {
  try {
    // Mapeia o nome do departamento para a role correspondente
    type RoleType = 'admin' | 'administrativo' | 'consultor' | 'educador' | 'estagiario' | 'financeiro' | 'franqueado' | 'gestor_pedagogico' | 'sala';
    
    const roleMap: Record<string, RoleType> = {
      'administrativo': 'administrativo',
      'financeiro': 'financeiro',
      'pedagogico': 'gestor_pedagogico'
    };
    
    const role = roleMap[departamento.toLowerCase()];
    if (!role) return [];

    const { data, error } = await supabase
      .from('unit_users')
      .select(`
        user_id,
        role,
        profiles!inner(
          id,
          full_name,
          email,
          access_blocked
        )
      `)
      .eq('role', role)
      .eq('active', true)
      .eq('profiles.access_blocked', false);

    if (error || !data) {
      console.error('Erro ao buscar usuários do departamento:', error);
      return [];
    }

    return data.map((item: any) => ({
      id: item.profiles.id,
      nome: item.profiles.full_name || '',
      email: item.profiles.email || ''
    }));
  } catch (error) {
    console.error('Erro ao buscar usuários do departamento:', error);
    return [];
  }
}

// Função para enviar atividade criada para o webhook
async function enviarAtividadeParaWebhook(atividade: {
  id: string;
  alerta_evasao_id: string;
  tipo_atividade: TipoAtividadeEvasao;
  descricao: string;
  responsavel_nome: string | null;
  status: string;
  data_agendada?: string | null;
  departamento_responsavel?: string | null;
}) {
  try {
    // Buscar dados adicionais do alerta (aluno, turma, professor)
    const { data: alertaData } = await supabase
      .from('alerta_evasao')
      .select(`
        id,
        data_alerta,
        origem_alerta,
        descritivo,
        alunos!inner(
          id,
          nome,
          turma_id,
          turmas(
            id,
            nome,
            professor_id,
            professores(id, nome, slack_username)
          )
        )
      `)
      .eq('id', atividade.alerta_evasao_id)
      .single();

    const aluno = alertaData?.alunos as any;
    const turma = aluno?.turmas;
    const professor = turma?.professores;

    // Buscar usuários do departamento se houver departamento_responsavel
    let usuariosDepartamento: Array<{ id: string; nome: string; email: string }> = [];
    if (atividade.departamento_responsavel) {
      usuariosDepartamento = await buscarUsuariosDoDepartamento(atividade.departamento_responsavel);
    }

    const payload = {
      atividade: {
        id: atividade.id,
        tipo_atividade: atividade.tipo_atividade,
        tipo_label: TIPOS_ATIVIDADE.find(t => t.value === atividade.tipo_atividade)?.label || atividade.tipo_atividade,
        descricao: atividade.descricao,
        responsavel_nome: atividade.responsavel_nome,
        status: atividade.status,
        data_agendada: atividade.data_agendada,
        departamento_responsavel: atividade.departamento_responsavel
      },
      alerta: {
        id: alertaData?.id,
        data_alerta: alertaData?.data_alerta,
        origem_alerta: alertaData?.origem_alerta,
        descritivo: alertaData?.descritivo
      },
      aluno: {
        id: aluno?.id,
        nome: aluno?.nome
      },
      turma: {
        id: turma?.id,
        nome: turma?.nome
      },
      professor: {
        id: professor?.id,
        nome: professor?.nome,
        slack_username: professor?.slack_username
      },
      usuarios_departamento: usuariosDepartamento,
      created_at: new Date().toISOString()
    };

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('Erro ao enviar atividade para webhook:', response.status, response.statusText);
    } else {
      console.log('Atividade enviada para webhook com sucesso:', atividade.tipo_atividade);
    }
  } catch (error) {
    console.error('Erro ao enviar atividade para webhook:', error);
    // Não lança erro para não interromper o fluxo principal
  }
}

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
          
          const { data: insertedTarefa, error: insertError } = await supabase
            .from('atividades_alerta_evasao')
            .insert(tarefaData as any)
            .select()
            .single();
          
          if (insertError) throw insertError;
          
          // Envia para o webhook
          if (insertedTarefa) {
            enviarAtividadeParaWebhook({
              id: insertedTarefa.id,
              alerta_evasao_id: alertaEvasaoId,
              tipo_atividade: tarefa.tipo,
              descricao: tarefa.descricao,
              responsavel_nome: 'Administrativo',
              status: 'pendente',
              departamento_responsavel: 'administrativo'
            });
          }
        }
        
        // Marcar atividade anterior como concluída se houver
        // (já foi feito no início, retorna sem criar atividade de evasão)
        return { id: 'tarefas_criadas', tipo_atividade: 'evasao' };
      }
      
      // Se não tiver data_agendada, usa a data de hoje como padrão
      const dataAgendadaFinal = data_agendada || format(new Date(), 'yyyy-MM-dd');
      
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
        data_agendada: dataAgendadaFinal,
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
      
      // Se for retenção, marca o alerta como retido
      if (isTerminalRetencao) {
        const { error: alertaError } = await supabase
          .from('alerta_evasao')
          .update({ 
            status: 'retido',
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
      
      // Envia a atividade criada para o webhook
      if (data) {
        enviarAtividadeParaWebhook({
          id: data.id,
          alerta_evasao_id: alertaEvasaoId,
          tipo_atividade,
          descricao,
          responsavel_nome,
          status: isTerminalRetencao ? 'concluida' : 'pendente',
          data_agendada,
          departamento_responsavel
        });
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
        
        const { data: retencaoInserted, error: retencaoError } = await supabase
          .from('atividades_alerta_evasao')
          .insert(retencaoData as any)
          .select()
          .single();
        
        if (retencaoError) throw retencaoError;
        
        // Envia para o webhook
        if (retencaoInserted) {
          enviarAtividadeParaWebhook({
            id: retencaoInserted.id,
            alerta_evasao_id: alertaEvasaoId,
            tipo_atividade: 'retencao',
            descricao: retencaoData.descricao,
            responsavel_nome: retencaoData.responsavel_nome,
            status: 'concluida'
          });
        }
        
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
        
        const { data: insertedTarefa, error: insertError } = await supabase
          .from('atividades_alerta_evasao')
          .insert(tarefaData as any)
          .select()
          .single();
        
        if (insertError) throw insertError;
        
        // Envia para o webhook
        if (insertedTarefa) {
          enviarAtividadeParaWebhook({
            id: insertedTarefa.id,
            alerta_evasao_id: alertaEvasaoId,
            tipo_atividade: tarefa.tipo,
            descricao: tarefa.descricao,
            responsavel_nome: 'Administrativo',
            status: 'pendente',
            data_agendada: tarefa.data_agendada,
            departamento_responsavel: 'administrativo'
          });
        }
      }
      
      // Se for ajuste definitivo, marca o alerta como retido
      if (deveResolverAlerta) {
        const { error: alertaError } = await supabase
          .from('alerta_evasao')
          .update({ 
            status: 'retido',
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
          
          const { data: evasaoInserted, error: evasaoError } = await supabase
            .from('atividades_alerta_evasao')
            .insert(evasaoData as any)
            .select()
            .single();
          
          if (evasaoError) throw evasaoError;
          
          // Envia para o webhook
          if (evasaoInserted) {
            enviarAtividadeParaWebhook({
              id: evasaoInserted.id,
              alerta_evasao_id: alertaEvasaoId,
              tipo_atividade: 'evasao',
              descricao: evasaoData.descricao,
              responsavel_nome: evasaoData.responsavel_nome,
              status: 'concluida'
            });
          }
          
          // Marca o alerta como evadido
          const { error: alertaError } = await supabase
            .from('alerta_evasao')
            .update({ 
              status: 'evadido',
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

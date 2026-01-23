import { useState, useMemo } from 'react';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle 
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, History, FileText, Check, ChevronDown, ChevronUp, Users, User, Calendar as CalendarIcon, AlertTriangle, TrendingDown, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  useAtividadesAlertaEvasao, 
  TIPOS_ATIVIDADE,
  TIPOS_PERMITIDOS_APOS_ACOLHIMENTO,
  type TipoAtividadeEvasao,
  type AtividadeAlertaEvasao
} from '@/hooks/use-atividades-alerta-evasao';
import type { AlertaEvasao } from '@/hooks/use-alertas-evasao-lista';
import { useAgendaProfessores } from '@/hooks/use-agenda-professores';
import { HORARIOS_FUNCIONAMENTO, type DiaSemana } from '@/constants/horariosFuncionamento';

type ResultadoNegociacao = 'evasao' | 'ajuste_temporario' | 'ajuste_definitivo';

interface AtividadesDrawerProps {
  open: boolean;
  onClose: () => void;
  alerta: AlertaEvasao | null;
}

// Tipos que são tarefas administrativas simples (podem ser concluídas diretamente)
const TIPOS_TAREFA_ADMIN = [
  'remover_sgs',
  'cancelar_assinatura',
  'remover_whatsapp',
  'corrigir_valores_sgs',
  'corrigir_valores_assinatura'
];

// Função para gerar slots de horário de 30 em 30 minutos
function gerarSlotsHorario(inicio: string, fim: string): string[] {
  const slots: string[] = [];
  const [horaInicio, minInicio] = inicio.split(':').map(Number);
  const [horaFim, minFim] = fim.split(':').map(Number);
  
  let totalMinutos = horaInicio * 60 + minInicio;
  const totalMinutosFim = horaFim * 60 + minFim;
  
  // Gerar slots até 1 hora antes do fim (para caber atendimento de 1h)
  while (totalMinutos <= totalMinutosFim - 60) {
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;
    slots.push(`${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`);
    totalMinutos += 30;
  }
  
  return slots;
}

// Função para verificar se um slot colide com um evento
function slotColideComEvento(
  slotInicio: string, 
  eventos: Array<{ horario_inicio: string; horario_fim: string }>
): boolean {
  const [slotHora, slotMin] = slotInicio.split(':').map(Number);
  const slotInicioMin = slotHora * 60 + slotMin;
  const slotFimMin = slotInicioMin + 60; // 1 hora de duração
  
  return eventos.some(evento => {
    const [eventoInicioHora, eventoInicioMin] = evento.horario_inicio.split(':').map(Number);
    const [eventoFimHora, eventoFimMin] = evento.horario_fim.split(':').map(Number);
    const eventoInicioTotal = eventoInicioHora * 60 + eventoInicioMin;
    const eventoFimTotal = eventoFimHora * 60 + eventoFimMin;
    
    // Verifica sobreposição
    return slotInicioMin < eventoFimTotal && slotFimMin > eventoInicioTotal;
  });
}

export function AtividadesDrawer({ open, onClose, alerta }: AtividadesDrawerProps) {
  const [atividadeExpandida, setAtividadeExpandida] = useState<string | null>(null);
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoAtividadeEvasao | null>(null);
  const [descricao, setDescricao] = useState('');
  
  // Estado para painel de resultado da negociação
  const [mostrarResultadoNegociacao, setMostrarResultadoNegociacao] = useState(false);
  const [atividadeNegociacao, setAtividadeNegociacao] = useState<AtividadeAlertaEvasao | null>(null);
  const [resultadoSelecionado, setResultadoSelecionado] = useState<ResultadoNegociacao | null>(null);
  const [dataFimAjuste, setDataFimAjuste] = useState('');
  const [observacoesNegociacao, setObservacoesNegociacao] = useState('');

  // Estado para painel de acolhimento expandido
  const [mostrarPainelAcolhimento, setMostrarPainelAcolhimento] = useState(false);
  const [atividadeAcolhimento, setAtividadeAcolhimento] = useState<AtividadeAlertaEvasao | null>(null);
  const [etapaAcolhimento, setEtapaAcolhimento] = useState<'observacoes' | 'proxima_atividade'>('observacoes');
  const [observacoesAcolhimento, setObservacoesAcolhimento] = useState('');
  const [tipoProximaAtividade, setTipoProximaAtividade] = useState<TipoAtividadeEvasao | null>(null);
  const [descricaoProximaAtividade, setDescricaoProximaAtividade] = useState('');

  // Estado para painel de confirmação de tarefa administrativa
  const [mostrarPainelTarefaAdmin, setMostrarPainelTarefaAdmin] = useState(false);
  const [atividadeTarefaAdmin, setAtividadeTarefaAdmin] = useState<AtividadeAlertaEvasao | null>(null);
  const [observacoesTarefaAdmin, setObservacoesTarefaAdmin] = useState('');

  // Estado para painel de agendamento pedagógico
  const [mostrarPainelPedagogico, setMostrarPainelPedagogico] = useState(false);
  const [dataPedagogico, setDataPedagogico] = useState<Date | undefined>(undefined);
  const [horarioPedagogico, setHorarioPedagogico] = useState('');
  const [descricaoPedagogico, setDescricaoPedagogico] = useState('');
  const [professorInfo, setProfessorInfo] = useState<{ id: string; nome: string } | null>(null);
  const [semanaPedagogico, setSemanaPedagogico] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Estado para painel de conclusão de atendimento pedagógico
  const [mostrarPainelConclusaoPedagogico, setMostrarPainelConclusaoPedagogico] = useState(false);
  const [atividadePedagogicoParaConcluir, setAtividadePedagogicoParaConcluir] = useState<AtividadeAlertaEvasao | null>(null);
  const [resultadoPedagogico, setResultadoPedagogico] = useState<'retencao' | 'negociacao_financeira' | null>(null);
  const [observacoesPedagogico, setObservacoesPedagogico] = useState('');

  // Estado para painel de Atendimento Financeiro (agendar direto do acolhimento)
  const [mostrarPainelAtendimentoFinanceiro, setMostrarPainelAtendimentoFinanceiro] = useState(false);
  const [dataAtendimentoFinanceiro, setDataAtendimentoFinanceiro] = useState<Date | undefined>(undefined);
  const [horarioAtendimentoFinanceiro, setHorarioAtendimentoFinanceiro] = useState('');

  const { 
    atividades, 
    isLoading,
    criarAtividade,
    isCriando,
    processarNegociacao,
    isProcessandoNegociacao,
    concluirTarefa,
    isConcluindoTarefa
  } = useAtividadesAlertaEvasao(alerta?.id || null);

  // Calcular data fim da semana para buscar agenda
  const dataFimSemana = useMemo(() => addDays(semanaPedagogico, 6), [semanaPedagogico]);

  // Buscar agenda do professor para verificar disponibilidade
  const { data: agendaData } = useAgendaProfessores(semanaPedagogico, dataFimSemana);

  const getTipoConfig = (tipo: TipoAtividadeEvasao) => {
    return TIPOS_ATIVIDADE.find(t => t.value === tipo) || { label: tipo, color: 'bg-gray-500' };
  };

  const formatarData = (data: string) => {
    try {
      return format(new Date(data), "dd/MM 'às' HH:mm", { locale: ptBR });
    } catch {
      return data;
    }
  };

  const formatarDataAgendada = (data: string) => {
    try {
      return format(new Date(data), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return data;
    }
  };

  const fecharPainelTarefaAdmin = () => {
    setMostrarPainelTarefaAdmin(false);
    setAtividadeTarefaAdmin(null);
    setObservacoesTarefaAdmin('');
  };

  const handleExpandirAtividade = (atividade: AtividadeAlertaEvasao) => {
    if (atividade.status === 'concluida') return;
    
    // Se for tarefa administrativa, expande o painel de confirmação
    if (TIPOS_TAREFA_ADMIN.includes(atividade.tipo_atividade)) {
      fecharPainelResultado();
      fecharPainelAcolhimento();
      fecharPainelAtendimentoFinanceiro();
      setAtividadeTarefaAdmin(atividade);
      setMostrarPainelTarefaAdmin(true);
      setObservacoesTarefaAdmin('');
      return;
    }
    
    // Se for atendimento financeiro (presencial), expande o painel de resultado
    if (atividade.tipo_atividade === 'atendimento_financeiro') {
      fecharPainelAcolhimento();
      fecharPainelConclusaoPedagogico();
      fecharPainelAtendimentoFinanceiro();
      setAtividadeNegociacao(atividade);
      setMostrarResultadoNegociacao(true);
      setResultadoSelecionado(null);
      setDataFimAjuste('');
      return;
    }


    // Se for acolhimento, expande o painel lateral
    if (atividade.tipo_atividade === 'acolhimento') {
      fecharPainelResultado();
      fecharPainelConclusaoPedagogico();
      fecharPainelAtendimentoFinanceiro();
      setAtividadeAcolhimento(atividade);
      setMostrarPainelAcolhimento(true);
      setEtapaAcolhimento('observacoes');
      setObservacoesAcolhimento('');
      setTipoProximaAtividade(null);
      setDescricaoProximaAtividade('');
      return;
    }

    // Se for atendimento pedagógico pendente, expande painel de conclusão
    if (atividade.tipo_atividade === 'atendimento_pedagogico') {
      fecharPainelResultado();
      fecharPainelAcolhimento();
      fecharPainelAtendimentoFinanceiro();
      setAtividadePedagogicoParaConcluir(atividade);
      setMostrarPainelConclusaoPedagogico(true);
      setResultadoPedagogico(null);
      setObservacoesPedagogico('');
      return;
    }
    
    if (atividadeExpandida === atividade.id) {
      setAtividadeExpandida(null);
      setTipoSelecionado(null);
      setDescricao('');
    } else {
      setAtividadeExpandida(atividade.id);
      setTipoSelecionado(null);
      setDescricao('');
    }
  };

  const handleConcluirTarefaAdmin = async () => {
    if (!atividadeTarefaAdmin) return;
    
    try {
      await concluirTarefa(atividadeTarefaAdmin.id);
      fecharPainelTarefaAdmin();
    } catch (error) {
      console.error('Erro ao concluir tarefa:', error);
    }
  };

  const handleCriarAtividade = async (atividadeAnteriorId: string) => {
    if (!tipoSelecionado || !descricao.trim()) return;
    
    await criarAtividade({
      tipo_atividade: tipoSelecionado,
      descricao: descricao.trim(),
      atividadeAnteriorId
    });
    
    setAtividadeExpandida(null);
    setTipoSelecionado(null);
    setDescricao('');
  };

  const handleConfirmarResultado = async () => {
    if (!resultadoSelecionado || !atividadeNegociacao) return;
    
    if (resultadoSelecionado === 'ajuste_temporario' && !dataFimAjuste) return;
    
    try {
      await processarNegociacao({
        resultado: resultadoSelecionado,
        atividadeAnteriorId: atividadeNegociacao.id,
        dataFimAjuste: resultadoSelecionado === 'ajuste_temporario' ? new Date(dataFimAjuste) : undefined,
        observacoes: observacoesNegociacao.trim() || undefined
      });
      
      setMostrarResultadoNegociacao(false);
      setAtividadeNegociacao(null);
      setResultadoSelecionado(null);
      setDataFimAjuste('');
      setObservacoesNegociacao('');
    } catch (error) {
      console.error('Erro ao processar negociação:', error);
    }
  };

  const fecharPainelResultado = () => {
    setMostrarResultadoNegociacao(false);
    setAtividadeNegociacao(null);
    setResultadoSelecionado(null);
    setDataFimAjuste('');
    setObservacoesNegociacao('');
  };

  const fecharPainelAcolhimento = () => {
    setMostrarPainelAcolhimento(false);
    setAtividadeAcolhimento(null);
    setEtapaAcolhimento('observacoes');
    setObservacoesAcolhimento('');
    setTipoProximaAtividade(null);
    setDescricaoProximaAtividade('');
  };

  const fecharPainelPedagogico = () => {
    setMostrarPainelPedagogico(false);
    setDataPedagogico(undefined);
    setHorarioPedagogico('');
    setDescricaoPedagogico('');
    setProfessorInfo(null);
    setSemanaPedagogico(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const fecharPainelConclusaoPedagogico = () => {
    setMostrarPainelConclusaoPedagogico(false);
    setAtividadePedagogicoParaConcluir(null);
    setResultadoPedagogico(null);
    setObservacoesPedagogico('');
  };

  const fecharPainelAtendimentoFinanceiro = () => {
    setMostrarPainelAtendimentoFinanceiro(false);
    setDataAtendimentoFinanceiro(undefined);
    setHorarioAtendimentoFinanceiro('');
  };

  const handleConfirmarAcolhimento = async () => {
    if (!tipoProximaAtividade || !atividadeAcolhimento || !observacoesAcolhimento.trim()) return;
    
    // Se for atendimento pedagógico, abrir painel de agendamento
    if (tipoProximaAtividade === 'atendimento_pedagogico') {
      // Buscar professor da turma do aluno
      const professorTurma = alerta?.aluno?.turma?.professor;
      if (professorTurma) {
        setProfessorInfo({ id: professorTurma.id, nome: professorTurma.nome });
      }
      
      setMostrarPainelAcolhimento(false);
      setMostrarPainelPedagogico(true);
      return;
    }

    // Se for atendimento financeiro, abrir painel de agendamento
    if (tipoProximaAtividade === 'atendimento_financeiro') {
      setMostrarPainelAcolhimento(false);
      setMostrarPainelAtendimentoFinanceiro(true);
      return;
    }
    
    if (!descricaoProximaAtividade.trim()) return;
    
    try {
      // Primeiro concluir o acolhimento atual com as observações
      await concluirTarefa(atividadeAcolhimento.id);
      
      // Criar próxima atividade com referência às observações do acolhimento
      const descricaoCompleta = `${descricaoProximaAtividade.trim()} | Obs. Acolhimento: ${observacoesAcolhimento.trim()}`;
      
      await criarAtividade({
        tipo_atividade: tipoProximaAtividade,
        descricao: descricaoCompleta,
        atividadeAnteriorId: atividadeAcolhimento.id
      });
      
      fecharPainelAcolhimento();
    } catch (error) {
      console.error('Erro ao processar acolhimento:', error);
    }
  };

  // Gerar slots de horário para atendimento financeiro (30 min cada)
  const horariosAtendimentoFinanceiro = useMemo(() => {
    if (!dataAtendimentoFinanceiro) return [];
    
    const diasSemana: DiaSemana[] = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const diaSemana = diasSemana[dataAtendimentoFinanceiro.getDay()];
    const horarioFuncionamento = HORARIOS_FUNCIONAMENTO[diaSemana];
    
    if (!horarioFuncionamento.aberto) return [];
    
    // Gerar slots de 30 em 30 min
    const slots: string[] = [];
    const [horaInicio, minInicio] = horarioFuncionamento.inicio.split(':').map(Number);
    const [horaFim, minFim] = horarioFuncionamento.fim.split(':').map(Number);
    
    let totalMinutos = horaInicio * 60 + minInicio;
    const totalMinutosFim = horaFim * 60 + minFim;
    
    while (totalMinutos < totalMinutosFim) {
      const horas = Math.floor(totalMinutos / 60);
      const minutos = totalMinutos % 60;
      slots.push(`${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`);
      totalMinutos += 30;
    }
    
    return slots;
  }, [dataAtendimentoFinanceiro]);

  const handleConfirmarAtendimentoFinanceiro = async () => {
    if (!atividadeAcolhimento || !observacoesAcolhimento.trim()) return;
    
    try {
      // Primeiro concluir o acolhimento
      await concluirTarefa(atividadeAcolhimento.id);
      
      // Montar descrição usando as observações do acolhimento + agendamento opcional
      let descricaoCompleta = observacoesAcolhimento.trim();
      if (dataAtendimentoFinanceiro && horarioAtendimentoFinanceiro) {
        descricaoCompleta += ` | Agendado para ${format(dataAtendimentoFinanceiro, 'dd/MM/yyyy')} às ${horarioAtendimentoFinanceiro}`;
      } else if (dataAtendimentoFinanceiro) {
        descricaoCompleta += ` | Agendado para ${format(dataAtendimentoFinanceiro, 'dd/MM/yyyy')}`;
      }
      
      // Criar o atendimento financeiro
      await criarAtividade({
        tipo_atividade: 'atendimento_financeiro',
        descricao: descricaoCompleta,
        atividadeAnteriorId: atividadeAcolhimento.id,
        data_agendada: dataAtendimentoFinanceiro ? format(dataAtendimentoFinanceiro, 'yyyy-MM-dd') : undefined
      });
      
      fecharPainelAtendimentoFinanceiro();
      setAtividadeAcolhimento(null);
      setTipoProximaAtividade(null);
      setDescricaoProximaAtividade('');
      setObservacoesAcolhimento('');
    } catch (error) {
      console.error('Erro ao agendar atendimento financeiro:', error);
    }
  };

  const handleConfirmarAgendamentoPedagogico = async () => {
    if (!dataPedagogico || !horarioPedagogico || !descricaoPedagogico.trim() || !atividadeAcolhimento) return;
    
    try {
      const dataFormatada = format(dataPedagogico, 'yyyy-MM-dd');
      
      await criarAtividade({
        tipo_atividade: 'atendimento_pedagogico',
        descricao: descricaoPedagogico.trim(),
        atividadeAnteriorId: atividadeAcolhimento.id,
        data_agendada: dataFormatada,
        horario_agendado: horarioPedagogico,
        professor_id_agendamento: professorInfo?.id
      });
      
      fecharPainelPedagogico();
      setAtividadeAcolhimento(null);
      setTipoProximaAtividade(null);
      setDescricaoProximaAtividade('');
    } catch (error) {
      console.error('Erro ao agendar atendimento pedagógico:', error);
    }
  };

  const handleConfirmarConclusaoPedagogico = async () => {
    if (!resultadoPedagogico || !atividadePedagogicoParaConcluir) return;
    
    try {
      // Se for retenção, cria atividade de retenção com observações
      if (resultadoPedagogico === 'retencao') {
        await criarAtividade({
          tipo_atividade: 'retencao',
          descricao: observacoesPedagogico.trim() || 'Aluno retido após atendimento pedagógico',
          atividadeAnteriorId: atividadePedagogicoParaConcluir.id
        });
        fecharPainelConclusaoPedagogico();
        return;
      }
      
      // Se for negociação financeira, cria atividade de negociação financeira
      if (resultadoPedagogico === 'negociacao_financeira') {
        await criarAtividade({
          tipo_atividade: 'atendimento_financeiro',
          descricao: observacoesPedagogico.trim() || 'Encaminhado para negociação financeira após atendimento pedagógico',
          atividadeAnteriorId: atividadePedagogicoParaConcluir.id
        });
        fecharPainelConclusaoPedagogico();
        return;
      }
    } catch (error) {
      console.error('Erro ao concluir atendimento pedagógico:', error);
    }
  };

  // Calcular horários disponíveis para a data selecionada
  const horariosDisponiveis = useMemo(() => {
    if (!dataPedagogico || !professorInfo?.id || !agendaData) return [];
    
    // Obter dia da semana
    const diasSemana: DiaSemana[] = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const diaSemana = diasSemana[dataPedagogico.getDay()];
    const horarioFuncionamento = HORARIOS_FUNCIONAMENTO[diaSemana];
    
    if (!horarioFuncionamento.aberto) return [];
    
    // Gerar todos os slots possíveis
    const todosSlots = gerarSlotsHorario(horarioFuncionamento.inicio, horarioFuncionamento.fim);
    
    // Buscar eventos do professor na data selecionada
    const agendaProfessor = agendaData[professorInfo.id];
    if (!agendaProfessor) return todosSlots;
    
    const dataFormatada = format(dataPedagogico, 'yyyy-MM-dd');
    
    // Filtrar eventos que acontecem na data selecionada:
    // 1. Eventos com data específica igual à data selecionada
    // 2. Aulas regulares (data = null) que acontecem no mesmo dia da semana
    const eventosDoDia = agendaProfessor.eventos.filter(e => {
      // Eventos pontuais com data específica
      if (e.data) {
        return e.data === dataFormatada;
      }
      // Aulas regulares baseadas no dia da semana
      return e.dia_semana === diaSemana;
    });
    
    // Filtrar slots que não colidem com eventos
    return todosSlots.filter(slot => !slotColideComEvento(slot, eventosDoDia));
  }, [dataPedagogico, professorInfo?.id, agendaData]);

  // Atualizar semana quando a data pedagógica mudar
  const handleDataPedagogicoChange = (date: Date | undefined) => {
    setDataPedagogico(date);
    setHorarioPedagogico(''); // Reset horário ao mudar data
    
    if (date) {
      const novaSemanainicio = startOfWeek(date, { weekStartsOn: 1 });
      if (!isSameDay(novaSemanainicio, semanaPedagogico)) {
        setSemanaPedagogico(novaSemanainicio);
      }
    }
  };

  const resetState = () => {
    setAtividadeExpandida(null);
    setTipoSelecionado(null);
    setDescricao('');
    fecharPainelResultado();
    fecharPainelAcolhimento();
    fecharPainelTarefaAdmin();
    fecharPainelPedagogico();
    fecharPainelConclusaoPedagogico();
    fecharPainelAtendimentoFinanceiro();
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Renderiza info do responsável baseado no tipo
  const renderResponsavelInfo = (atividade: AtividadeAlertaEvasao) => {
    const isPendente = atividade.status === 'pendente';
    
    if (!isPendente && atividade.concluido_por_nome) {
      return (
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <User className="h-2.5 w-2.5" />
          {atividade.concluido_por_nome}
        </span>
      );
    }
    
    if (atividade.departamento_responsavel) {
      return (
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Users className="h-2.5 w-2.5" />
          {atividade.departamento_responsavel === 'administrativo' ? 'Adm' : atividade.departamento_responsavel}
        </span>
      );
    }
    
    if (atividade.responsavel_nome) {
      return (
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <User className="h-2.5 w-2.5" />
          {atividade.responsavel_nome}
        </span>
      );
    }
    
    return null;
  };

  // Renderiza badge de status terminal
  const renderTerminalBadge = (atividade: AtividadeAlertaEvasao) => {
    if (atividade.tipo_atividade === 'retencao') {
      return (
        <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0">
          ✓ Retido
        </Badge>
      );
    }
    if (atividade.tipo_atividade === 'evasao') {
      return (
        <Badge className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0">
          ✗ Evadido
        </Badge>
      );
    }
    return null;
  };

  // Renderiza data agendada se houver
  const renderDataAgendada = (atividade: AtividadeAlertaEvasao) => {
    if (!atividade.data_agendada) return null;
    
    return (
      <span className="text-[10px] text-amber-600 flex items-center gap-1">
        <Calendar className="h-2.5 w-2.5" />
        {formatarDataAgendada(atividade.data_agendada)}
      </span>
    );
  };

  if (!alerta) return null;

  // Largura do drawer: normal ou expandido
  const isExpanded = mostrarResultadoNegociacao || mostrarPainelAcolhimento || mostrarPainelTarefaAdmin || mostrarPainelPedagogico || mostrarPainelConclusaoPedagogico || mostrarPainelAtendimentoFinanceiro;
  const drawerWidth = isExpanded ? 'max-w-2xl' : 'max-w-sm';

  return (
    <Drawer open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DrawerContent direction="right" className={`h-full w-full ${drawerWidth} transition-all duration-200`}>
        <DrawerHeader className="border-b py-2 px-3">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="text-sm font-semibold">Histórico de Atividades</DrawerTitle>
              <p className="text-xs text-muted-foreground">
                {alerta.aluno?.nome || 'Aluno não identificado'}
              </p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClose}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </DrawerHeader>

        <div className="flex h-[calc(100%-3rem)]">
          {/* Coluna esquerda: Lista de atividades */}
          <div className={`flex flex-col ${isExpanded ? 'w-1/2 border-r' : 'w-full'}`}>
            <div className="px-3 py-2 border-b flex items-center gap-1.5 bg-muted/30">
              <History className="h-3 w-3" />
              <span className="font-medium text-xs">Atividades</span>
              <Badge variant="secondary" className="ml-auto text-[10px] h-4 px-1.5">
                {atividades.length}
              </Badge>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1.5">
                {isLoading ? (
                  <div className="text-center py-6 text-muted-foreground text-xs">
                    Carregando...
                  </div>
                ) : atividades.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <FileText className="h-6 w-6 mx-auto mb-1.5 opacity-50" />
                    <p className="text-xs">Nenhuma atividade</p>
                  </div>
                ) : (
                  atividades.map((atividade) => {
                    const tipoConfig = getTipoConfig(atividade.tipo_atividade);
                    const isPendente = atividade.status === 'pendente';
                    const isExpanded = atividadeExpandida === atividade.id;
                    const isTerminal = ['retencao', 'evasao'].includes(atividade.tipo_atividade);
                    const isTarefaAdmin = TIPOS_TAREFA_ADMIN.includes(atividade.tipo_atividade);
                    const isNegociacaoFinanceira = atividade.tipo_atividade === 'atendimento_financeiro';
                    const isAcolhimento = atividade.tipo_atividade === 'acolhimento';
                    const isNegociacaoAtiva = mostrarResultadoNegociacao && atividadeNegociacao?.id === atividade.id;
                    const isAcolhimentoAtivo = mostrarPainelAcolhimento && atividadeAcolhimento?.id === atividade.id;
                    const isTarefaAdminAtiva = mostrarPainelTarefaAdmin && atividadeTarefaAdmin?.id === atividade.id;
                    const isPainelAtivo = isNegociacaoAtiva || isAcolhimentoAtivo || isTarefaAdminAtiva;
                    
                    return (
                      <Card 
                        key={atividade.id} 
                        className={`overflow-hidden transition-all ${
                          isPendente ? 'cursor-pointer hover:shadow-sm' : ''
                        } ${!isPendente ? 'opacity-70' : ''} ${isPainelAtivo ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => handleExpandirAtividade(atividade)}
                      >
                        <div className={`h-1 ${tipoConfig.color}`} />
                        <CardContent className="p-2 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1 flex-wrap">
                              <Badge className={`${tipoConfig.color} text-white text-[10px] px-1.5 py-0`}>
                                {tipoConfig.label}
                              </Badge>
                              {!isPendente && !isTerminal && (
                                <Check className="h-3 w-3 text-green-600" />
                              )}
                              {isTerminal && renderTerminalBadge(atividade)}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-muted-foreground">
                                {formatarData(atividade.created_at)}
                              </span>
                              {isPendente && !isTarefaAdmin && !isNegociacaoFinanceira && !isAcolhimento && (
                                atividadeExpandida === atividade.id 
                                  ? <ChevronUp className="h-3 w-3 text-muted-foreground" />
                                  : <ChevronDown className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          <p className="text-xs leading-tight">{atividade.descricao}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {renderResponsavelInfo(atividade)}
                            {renderDataAgendada(atividade)}
                          </div>
                          
                          
                          {/* Formulário para criar nova atividade (expandido) */}
                          {atividadeExpandida === atividade.id && isPendente && !isTarefaAdmin && !isNegociacaoFinanceira && !isAcolhimento && (
                            <div 
                              className="mt-2 pt-2 border-t space-y-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <p className="text-[10px] font-medium">Nova atividade:</p>
                              
                              <div className="flex flex-wrap gap-1">
                                {TIPOS_PERMITIDOS_APOS_ACOLHIMENTO.map((tipo) => {
                                  const config = getTipoConfig(tipo);
                                  const isSelected = tipoSelecionado === tipo;
                                  return (
                                    <Badge
                                      key={tipo}
                                      className={`cursor-pointer transition-all text-[10px] px-1.5 py-0 ${
                                        isSelected 
                                          ? `${config.color} text-white ring-1 ring-offset-1` 
                                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                      }`}
                                      onClick={() => setTipoSelecionado(tipo)}
                                    >
                                      {config.label}
                                    </Badge>
                                  );
                                })}
                              </div>
                              
                              <Textarea
                                placeholder="Descrição..."
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                rows={2}
                                className="text-xs min-h-[50px]"
                              />
                              
                              <Button
                                size="sm"
                                disabled={!tipoSelecionado || !descricao.trim() || isCriando}
                                onClick={() => handleCriarAtividade(atividade.id)}
                                className="w-full h-6 text-[10px]"
                              >
                                {isCriando ? 'Salvando...' : 'Registrar'}
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Coluna direita: Resultado da Negociação Financeira */}
          {mostrarResultadoNegociacao && (
            <div className="w-1/2 flex flex-col bg-muted/20">
              <div className="px-3 py-2 border-b flex items-center justify-between bg-muted/30">
                <span className="font-medium text-xs">Resultado da Negociação</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={fecharPainelResultado}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="p-3 space-y-3 flex-1">
                <p className="text-[10px] text-muted-foreground">
                  Selecione o resultado da negociação financeira:
                </p>

                {/* Opção: Evasão */}
                <button
                  type="button"
                  onClick={() => setResultadoSelecionado('evasao')}
                  className={`w-full p-2 rounded border text-left transition-all ${
                    resultadoSelecionado === 'evasao'
                      ? 'border-red-500 bg-red-50 ring-1 ring-red-500'
                      : 'border-border hover:border-red-300 hover:bg-red-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded ${resultadoSelecionado === 'evasao' ? 'bg-red-500' : 'bg-red-100'}`}>
                      <AlertTriangle className={`h-3 w-3 ${resultadoSelecionado === 'evasao' ? 'text-white' : 'text-red-600'}`} />
                    </div>
                    <div>
                      <p className={`text-xs font-medium ${resultadoSelecionado === 'evasao' ? 'text-red-700' : ''}`}>
                        Evasão
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Aluno não retido
                      </p>
                    </div>
                  </div>
                </button>

                {/* Opção: Ajuste Temporário */}
                <button
                  type="button"
                  onClick={() => setResultadoSelecionado('ajuste_temporario')}
                  className={`w-full p-2 rounded border text-left transition-all ${
                    resultadoSelecionado === 'ajuste_temporario'
                      ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500'
                      : 'border-border hover:border-amber-300 hover:bg-amber-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded ${resultadoSelecionado === 'ajuste_temporario' ? 'bg-amber-500' : 'bg-amber-100'}`}>
                      <TrendingDown className={`h-3 w-3 ${resultadoSelecionado === 'ajuste_temporario' ? 'text-white' : 'text-amber-600'}`} />
                    </div>
                    <div>
                      <p className={`text-xs font-medium ${resultadoSelecionado === 'ajuste_temporario' ? 'text-amber-700' : ''}`}>
                        Ajuste Temporário
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Nova negociação na data fim
                      </p>
                    </div>
                  </div>
                </button>

                {/* Campo de data para ajuste temporário */}
                {resultadoSelecionado === 'ajuste_temporario' && (
                  <div className="pl-6 space-y-1">
                    <Label className="text-[10px]">Data fim do ajuste *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-7 justify-start text-left font-normal text-xs",
                            !dataFimAjuste && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {dataFimAjuste ? format(new Date(dataFimAjuste), "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione a data</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                        <Calendar
                          mode="single"
                          selected={dataFimAjuste ? new Date(dataFimAjuste) : undefined}
                          onSelect={(date) => setDataFimAjuste(date ? date.toISOString().split('T')[0] : '')}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {/* Opção: Ajuste Definitivo */}
                <button
                  type="button"
                  onClick={() => setResultadoSelecionado('ajuste_definitivo')}
                  className={`w-full p-2 rounded border text-left transition-all ${
                    resultadoSelecionado === 'ajuste_definitivo'
                      ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
                      : 'border-border hover:border-green-300 hover:bg-green-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded ${resultadoSelecionado === 'ajuste_definitivo' ? 'bg-green-500' : 'bg-green-100'}`}>
                      <TrendingUp className={`h-3 w-3 ${resultadoSelecionado === 'ajuste_definitivo' ? 'text-white' : 'text-green-600'}`} />
                    </div>
                    <div>
                      <p className={`text-xs font-medium ${resultadoSelecionado === 'ajuste_definitivo' ? 'text-green-700' : ''}`}>
                        Ajuste Definitivo
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Aluno retido com sucesso
                      </p>
                    </div>
                  </div>
                </button>

                {/* Campo de observações da negociação */}
                {resultadoSelecionado && (
                  <div className="space-y-1">
                    <Label className="text-[10px]">Observações da negociação</Label>
                    <Textarea
                      placeholder="Descreva os detalhes da negociação, valores acordados, motivos..."
                      value={observacoesNegociacao}
                      onChange={(e) => setObservacoesNegociacao(e.target.value)}
                      rows={3}
                      className="text-xs min-h-[60px] resize-none"
                    />
                  </div>
                )}

                {/* Botão de confirmação */}
                <div className="pt-2">
                  <Button
                    size="sm"
                    className="w-full h-7 text-xs"
                    disabled={
                      !resultadoSelecionado || 
                      (resultadoSelecionado === 'ajuste_temporario' && !dataFimAjuste) ||
                      isProcessandoNegociacao
                    }
                    onClick={handleConfirmarResultado}
                  >
                    {isProcessandoNegociacao ? 'Processando...' : 'Confirmar'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Coluna direita: Painel de Acolhimento */}
          {mostrarPainelAcolhimento && atividadeAcolhimento && (
            <div className="w-1/2 flex flex-col bg-muted/20">
              <div className="px-3 py-2 border-b flex items-center justify-between bg-muted/30">
                <span className="font-medium text-xs">
                  {etapaAcolhimento === 'observacoes' ? 'Concluir Acolhimento' : 'Próxima Ação'}
                </span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={fecharPainelAcolhimento}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="p-3 space-y-3 flex-1">
                {/* Etapa 1: Observações do atendimento realizado */}
                {etapaAcolhimento === 'observacoes' && (
                  <>
                    {/* Card da atividade */}
                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <Badge className="bg-yellow-500 text-white text-[10px] px-1.5 py-0 mb-1">
                        Acolhimento
                      </Badge>
                      <p className="text-xs mt-1">{atividadeAcolhimento.descricao}</p>
                      {atividadeAcolhimento.data_agendada && (
                        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                          <CalendarIcon className="h-2.5 w-2.5" />
                          Agendado para: {formatarDataAgendada(atividadeAcolhimento.data_agendada)}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px]">Descreva como foi o acolhimento *</Label>
                      <Textarea
                        placeholder="Relate os pontos abordados, percepções sobre o aluno/responsável, situação atual..."
                        value={observacoesAcolhimento}
                        onChange={(e) => setObservacoesAcolhimento(e.target.value)}
                        rows={4}
                        className="text-xs min-h-[80px] resize-none"
                      />
                    </div>

                    <div className="pt-2">
                      <Button
                        size="sm"
                        className="w-full h-7 text-xs"
                        disabled={!observacoesAcolhimento.trim()}
                        onClick={() => setEtapaAcolhimento('proxima_atividade')}
                      >
                        Próximo
                      </Button>
                    </div>
                  </>
                )}

                {/* Etapa 2: Selecionar próxima atividade */}
                {etapaAcolhimento === 'proxima_atividade' && (
                  <>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[10px]"
                        onClick={() => setEtapaAcolhimento('observacoes')}
                      >
                        ← Voltar
                      </Button>
                      <p className="text-[10px] text-muted-foreground">
                        Selecione a próxima ação:
                      </p>
                    </div>

                    {/* Opção: Atendimento Financeiro */}
                    <button
                      type="button"
                      onClick={() => setTipoProximaAtividade('atendimento_financeiro')}
                      className={`w-full p-2 rounded border text-left transition-all ${
                        tipoProximaAtividade === 'atendimento_financeiro'
                          ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500'
                          : 'border-border hover:border-purple-300 hover:bg-purple-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${tipoProximaAtividade === 'atendimento_financeiro' ? 'bg-purple-500' : 'bg-purple-100'}`}>
                          <DollarSign className={`h-3 w-3 ${tipoProximaAtividade === 'atendimento_financeiro' ? 'text-white' : 'text-purple-600'}`} />
                        </div>
                        <div>
                          <p className={`text-xs font-medium ${tipoProximaAtividade === 'atendimento_financeiro' ? 'text-purple-700' : ''}`}>
                            Atendimento Financeiro
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Agendar negociação presencial
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Opção: Atendimento Pedagógico */}
                    <button
                      type="button"
                      onClick={() => setTipoProximaAtividade('atendimento_pedagogico')}
                      className={`w-full p-2 rounded border text-left transition-all ${
                        tipoProximaAtividade === 'atendimento_pedagogico'
                          ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500'
                          : 'border-border hover:border-orange-300 hover:bg-orange-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${tipoProximaAtividade === 'atendimento_pedagogico' ? 'bg-orange-500' : 'bg-orange-100'}`}>
                          <User className={`h-3 w-3 ${tipoProximaAtividade === 'atendimento_pedagogico' ? 'text-white' : 'text-orange-600'}`} />
                        </div>
                        <div>
                          <p className={`text-xs font-medium ${tipoProximaAtividade === 'atendimento_pedagogico' ? 'text-orange-700' : ''}`}>
                            Atendimento Pedagógico
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Agendar com o professor
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Opção: Novo Acolhimento */}
                    <button
                      type="button"
                      onClick={() => setTipoProximaAtividade('acolhimento')}
                      className={`w-full p-2 rounded border text-left transition-all ${
                        tipoProximaAtividade === 'acolhimento'
                          ? 'border-yellow-500 bg-yellow-50 ring-1 ring-yellow-500'
                          : 'border-border hover:border-yellow-300 hover:bg-yellow-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${tipoProximaAtividade === 'acolhimento' ? 'bg-yellow-500' : 'bg-yellow-100'}`}>
                          <History className={`h-3 w-3 ${tipoProximaAtividade === 'acolhimento' ? 'text-white' : 'text-yellow-600'}`} />
                        </div>
                        <div>
                          <p className={`text-xs font-medium ${tipoProximaAtividade === 'acolhimento' ? 'text-yellow-700' : ''}`}>
                            Novo Acolhimento
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Agendar outro acolhimento
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Opção: Retenção */}
                    <button
                      type="button"
                      onClick={() => setTipoProximaAtividade('retencao')}
                      className={`w-full p-2 rounded border text-left transition-all ${
                        tipoProximaAtividade === 'retencao'
                          ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
                          : 'border-border hover:border-green-300 hover:bg-green-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${tipoProximaAtividade === 'retencao' ? 'bg-green-500' : 'bg-green-100'}`}>
                          <TrendingUp className={`h-3 w-3 ${tipoProximaAtividade === 'retencao' ? 'text-white' : 'text-green-600'}`} />
                        </div>
                        <div>
                          <p className={`text-xs font-medium ${tipoProximaAtividade === 'retencao' ? 'text-green-700' : ''}`}>
                            Retenção
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Aluno retido com sucesso
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Campo de descrição da próxima atividade - só para acolhimento e retenção */}
                    {tipoProximaAtividade && (tipoProximaAtividade === 'acolhimento' || tipoProximaAtividade === 'retencao') && (
                      <div className="space-y-1">
                        <Label className="text-[10px]">
                          {tipoProximaAtividade === 'retencao' ? 'Observações da retenção' : 'Descrição do acolhimento'} *
                        </Label>
                        <Textarea
                          placeholder={tipoProximaAtividade === 'retencao' 
                            ? "Descreva como foi a retenção do aluno..."
                            : "Descreva os detalhes do próximo acolhimento..."
                          }
                          value={descricaoProximaAtividade}
                          onChange={(e) => setDescricaoProximaAtividade(e.target.value)}
                          rows={3}
                          className="text-xs min-h-[60px] resize-none"
                        />
                      </div>
                    )}

                    {/* Botão de confirmação */}
                    <div className="pt-2">
                      <Button
                        size="sm"
                        className="w-full h-7 text-xs"
                        disabled={
                          !tipoProximaAtividade || 
                          (tipoProximaAtividade !== 'atendimento_pedagogico' && tipoProximaAtividade !== 'atendimento_financeiro' && !descricaoProximaAtividade.trim()) ||
                          isCriando
                        }
                        onClick={handleConfirmarAcolhimento}
                      >
                        {tipoProximaAtividade === 'atendimento_pedagogico' 
                          ? 'Agendar Atendimento' 
                          : tipoProximaAtividade === 'atendimento_financeiro'
                          ? 'Agendar Atendimento'
                          : isCriando ? 'Registrando...' : 'Confirmar'}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Coluna direita: Painel de Confirmação de Tarefa Administrativa */}
          {mostrarPainelTarefaAdmin && atividadeTarefaAdmin && (
            <div className="w-1/2 flex flex-col bg-muted/20">
              <div className="px-3 py-2 border-b flex items-center justify-between bg-muted/30">
                <span className="font-medium text-xs">Confirmar Tarefa</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={fecharPainelTarefaAdmin}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="p-3 space-y-3 flex-1">
                {/* Informação da tarefa */}
                <div className="p-2 bg-muted/50 rounded border">
                  <Badge className={`${getTipoConfig(atividadeTarefaAdmin.tipo_atividade).color} text-white text-[10px] px-1.5 py-0 mb-1`}>
                    {getTipoConfig(atividadeTarefaAdmin.tipo_atividade).label}
                  </Badge>
                  <p className="text-xs mt-1">{atividadeTarefaAdmin.descricao}</p>
                </div>

                <p className="text-[10px] text-muted-foreground">
                  Confirme que a tarefa foi realizada:
                </p>

                {/* Campo de observações */}
                <div className="space-y-1">
                  <Label className="text-[10px]">Observações (opcional)</Label>
                  <Textarea
                    placeholder="Adicione observações sobre a execução da tarefa..."
                    value={observacoesTarefaAdmin}
                    onChange={(e) => setObservacoesTarefaAdmin(e.target.value)}
                    rows={3}
                    className="text-xs min-h-[60px] resize-none"
                  />
                </div>

                {/* Botão de confirmação */}
                <div className="pt-2">
                  <Button
                    size="sm"
                    className="w-full h-7 text-xs"
                    disabled={isConcluindoTarefa}
                    onClick={handleConcluirTarefaAdmin}
                  >
                    {isConcluindoTarefa ? 'Concluindo...' : 'Confirmar Conclusão'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Coluna direita: Painel de Agendamento Pedagógico */}
          {mostrarPainelPedagogico && (
            <div className="w-1/2 flex flex-col bg-muted/20">
              <div className="px-3 py-2 border-b flex items-center justify-between bg-muted/30">
                <span className="font-medium text-xs">Agendar Atendimento Pedagógico</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={fecharPainelPedagogico}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-3">
                  {/* Informação do professor */}
                  {professorInfo && (
                    <div className="p-2 bg-orange-50 border border-orange-200 rounded">
                      <p className="text-[10px] text-muted-foreground">Professor responsável</p>
                      <p className="text-xs font-medium text-orange-700">{professorInfo.nome}</p>
                    </div>
                  )}

                  {!professorInfo && (
                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-[10px] text-yellow-700">
                        Não foi possível identificar o professor da turma do aluno.
                      </p>
                    </div>
                  )}

                  {/* Seleção de data */}
                  <div className="space-y-1">
                    <Label className="text-[10px]">Data do atendimento *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-7 justify-start text-left font-normal text-xs",
                            !dataPedagogico && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {dataPedagogico 
                            ? format(dataPedagogico, "dd/MM/yyyy (EEEE)", { locale: ptBR }) 
                            : <span>Selecione a data</span>
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                        <Calendar
                          mode="single"
                          selected={dataPedagogico}
                          onSelect={handleDataPedagogicoChange}
                          disabled={(date) => {
                            // Desabilitar datas passadas e domingos
                            const hoje = new Date();
                            hoje.setHours(0, 0, 0, 0);
                            return date < hoje || date.getDay() === 0;
                          }}
                          locale={ptBR}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Seleção de horário */}
                  {dataPedagogico && (
                    <div className="space-y-1">
                      <Label className="text-[10px]">Horário do atendimento *</Label>
                      {horariosDisponiveis.length === 0 ? (
                        <div className="p-2 bg-red-50 border border-red-200 rounded">
                          <p className="text-[10px] text-red-700">
                            Não há horários disponíveis nesta data. O professor está com a agenda cheia.
                          </p>
                        </div>
                      ) : (
                        <Select value={horarioPedagogico} onValueChange={setHorarioPedagogico}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Selecione o horário" />
                          </SelectTrigger>
                          <SelectContent className="z-[9999]">
                            {horariosDisponiveis.map((horario) => {
                              // Calcular horário fim
                              const [h, m] = horario.split(':').map(Number);
                              const fimMin = h * 60 + m + 60;
                              const fimH = Math.floor(fimMin / 60);
                              const fimM = fimMin % 60;
                              const horarioFim = `${String(fimH).padStart(2, '0')}:${String(fimM).padStart(2, '0')}`;
                              
                              return (
                                <SelectItem key={horario} value={horario} className="text-xs">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-3 w-3" />
                                    {horario} - {horarioFim}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}

                  {/* Campo de descrição */}
                  {dataPedagogico && horarioPedagogico && (
                    <div className="space-y-1">
                      <Label className="text-[10px]">Descrição do atendimento *</Label>
                      <Textarea
                        placeholder="Descreva o objetivo do atendimento pedagógico..."
                        value={descricaoPedagogico}
                        onChange={(e) => setDescricaoPedagogico(e.target.value)}
                        rows={3}
                        className="text-xs min-h-[60px] resize-none"
                      />
                    </div>
                  )}

                  {/* Resumo do agendamento */}
                  {dataPedagogico && horarioPedagogico && descricaoPedagogico.trim() && (
                    <div className="p-2 bg-green-50 border border-green-200 rounded space-y-1">
                      <p className="text-[10px] font-medium text-green-700">Resumo do agendamento:</p>
                      <div className="text-[10px] text-green-600 space-y-0.5">
                        <p>📅 {format(dataPedagogico, "dd/MM/yyyy").toUpperCase()}</p>
                        <p>🕐 {horarioPedagogico} - 1 hora de duração</p>
                        {professorInfo && <p>👨‍🏫 {professorInfo.nome}</p>}
                      </div>
                    </div>
                  )}

                  {/* Botão de confirmação */}
                  <div className="pt-2">
                    <Button
                      size="sm"
                      className="w-full h-7 text-xs"
                      disabled={
                        !dataPedagogico || 
                        !horarioPedagogico || 
                        !descricaoPedagogico.trim() ||
                        isCriando
                      }
                      onClick={handleConfirmarAgendamentoPedagogico}
                    >
                      {isCriando ? 'Agendando...' : 'Confirmar Agendamento'}
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Coluna direita: Painel de Conclusão do Atendimento Pedagógico */}
          {mostrarPainelConclusaoPedagogico && atividadePedagogicoParaConcluir && (
            <div className="w-1/2 flex flex-col bg-muted/20">
              <div className="px-3 py-2 border-b flex items-center justify-between bg-muted/30">
                <span className="font-medium text-xs">Concluir Atendimento Pedagógico</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={fecharPainelConclusaoPedagogico}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="p-3 space-y-3 flex-1">
                {/* Informação da atividade */}
                <div className="p-2 bg-orange-50 border border-orange-200 rounded">
                  <Badge className="bg-orange-500 text-white text-[10px] px-1.5 py-0 mb-1">
                    Atendimento Pedagógico
                  </Badge>
                  <p className="text-xs mt-1">{atividadePedagogicoParaConcluir.descricao}</p>
                  {atividadePedagogicoParaConcluir.data_agendada && (
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <CalendarIcon className="h-2.5 w-2.5" />
                      Agendado para: {formatarDataAgendada(atividadePedagogicoParaConcluir.data_agendada)}
                    </p>
                  )}
                </div>

                <p className="text-[10px] text-muted-foreground">
                  Selecione o resultado do atendimento pedagógico:
                </p>

                {/* Opção: Retenção */}
                <button
                  type="button"
                  onClick={() => setResultadoPedagogico('retencao')}
                  className={`w-full p-2 rounded border text-left transition-all ${
                    resultadoPedagogico === 'retencao'
                      ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
                      : 'border-border hover:border-green-300 hover:bg-green-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded ${resultadoPedagogico === 'retencao' ? 'bg-green-500' : 'bg-green-100'}`}>
                      <TrendingUp className={`h-3 w-3 ${resultadoPedagogico === 'retencao' ? 'text-white' : 'text-green-600'}`} />
                    </div>
                    <div>
                      <p className={`text-xs font-medium ${resultadoPedagogico === 'retencao' ? 'text-green-700' : ''}`}>
                        Retenção
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Aluno retido com sucesso
                      </p>
                    </div>
                  </div>
                </button>

                {/* Opção: Negociação Financeira */}
                <button
                  type="button"
                  onClick={() => setResultadoPedagogico('negociacao_financeira')}
                  className={`w-full p-2 rounded border text-left transition-all ${
                    resultadoPedagogico === 'negociacao_financeira'
                      ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500'
                      : 'border-border hover:border-purple-300 hover:bg-purple-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded ${resultadoPedagogico === 'negociacao_financeira' ? 'bg-purple-500' : 'bg-purple-100'}`}>
                      <TrendingDown className={`h-3 w-3 ${resultadoPedagogico === 'negociacao_financeira' ? 'text-white' : 'text-purple-600'}`} />
                    </div>
                    <div>
                      <p className={`text-xs font-medium ${resultadoPedagogico === 'negociacao_financeira' ? 'text-purple-700' : ''}`}>
                        Negociação Financeira
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Encaminhar para negociação
                      </p>
                    </div>
                  </div>
                </button>

                {/* Campo de observações */}
                {resultadoPedagogico && (
                  <div className="space-y-1">
                    <Label className="text-[10px]">Observações do atendimento</Label>
                    <Textarea
                      placeholder="Descreva os detalhes do atendimento realizado..."
                      value={observacoesPedagogico}
                      onChange={(e) => setObservacoesPedagogico(e.target.value)}
                      rows={3}
                      className="text-xs min-h-[60px] resize-none"
                    />
                  </div>
                )}

                {/* Botão de confirmação */}
                <div className="pt-2">
                  <Button
                    size="sm"
                    className="w-full h-7 text-xs"
                    disabled={!resultadoPedagogico || isCriando}
                    onClick={handleConfirmarConclusaoPedagogico}
                  >
                    {isCriando ? 'Processando...' : 'Confirmar'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Coluna direita: Painel de Agendar Atendimento Financeiro */}
          {mostrarPainelAtendimentoFinanceiro && (
            <div className="w-1/2 flex flex-col bg-muted/20">
              <div className="px-3 py-2 border-b flex items-center justify-between bg-muted/30">
                <span className="font-medium text-xs">Agendar Atendimento Financeiro</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={fecharPainelAtendimentoFinanceiro}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-3">
                  {/* Card com estilo igual ao pedagógico */}
                  <button
                    type="button"
                    className="w-full p-2 rounded border border-purple-500 bg-purple-50 ring-1 ring-purple-500 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-purple-500">
                        <DollarSign className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-purple-700">
                          Atendimento Financeiro
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Negociação presencial com o responsável
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Seleção de data */}
                  <div className="space-y-1">
                    <Label className="text-[10px]">Data do atendimento (opcional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-7 justify-start text-left font-normal text-xs",
                            !dataAtendimentoFinanceiro && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {dataAtendimentoFinanceiro 
                            ? format(dataAtendimentoFinanceiro, "dd/MM/yyyy (EEEE)", { locale: ptBR }) 
                            : <span>Selecione a data</span>
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                        <Calendar
                          mode="single"
                          selected={dataAtendimentoFinanceiro}
                          onSelect={(date) => {
                            setDataAtendimentoFinanceiro(date);
                            setHorarioAtendimentoFinanceiro('');
                          }}
                          disabled={(date) => {
                            const hoje = new Date();
                            hoje.setHours(0, 0, 0, 0);
                            return date < hoje || date.getDay() === 0;
                          }}
                          locale={ptBR}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Seleção de horário */}
                  {dataAtendimentoFinanceiro && (
                    <div className="space-y-1">
                      <Label className="text-[10px]">Horário do atendimento (opcional)</Label>
                      {horariosAtendimentoFinanceiro.length === 0 ? (
                        <div className="p-2 bg-red-50 border border-red-200 rounded">
                          <p className="text-[10px] text-red-700">
                            Não há horários disponíveis nesta data.
                          </p>
                        </div>
                      ) : (
                        <Select value={horarioAtendimentoFinanceiro} onValueChange={setHorarioAtendimentoFinanceiro}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Selecione o horário" />
                          </SelectTrigger>
                          <SelectContent className="z-[9999]">
                            {horariosAtendimentoFinanceiro.map((horario) => (
                              <SelectItem key={horario} value={horario} className="text-xs">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  {horario}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}

                  {/* Resumo do agendamento - só mostra se tiver data ou hora */}
                  {(dataAtendimentoFinanceiro || horarioAtendimentoFinanceiro) && (
                    <div className="p-2 bg-green-50 border border-green-200 rounded space-y-1">
                      <p className="text-[10px] font-medium text-green-700">Resumo:</p>
                      <div className="text-[10px] text-green-600 space-y-0.5">
                        {dataAtendimentoFinanceiro && <p>📅 {format(dataAtendimentoFinanceiro, "dd/MM/yyyy")}</p>}
                        {horarioAtendimentoFinanceiro && <p>🕐 {horarioAtendimentoFinanceiro}</p>}
                        <p>🏢 Atendimento Presencial</p>
                      </div>
                    </div>
                  )}

                  {/* Botão de confirmação */}
                  <div className="pt-2">
                    <Button
                      size="sm"
                      className="w-full h-7 text-xs"
                      disabled={isCriando}
                      onClick={handleConfirmarAtendimentoFinanceiro}
                    >
                      {isCriando ? 'Agendando...' : 'Confirmar Agendamento'}
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

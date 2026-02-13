import { useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, addWeeks, isToday, isSameWeek, parseISO, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveUnit } from '@/contexts/ActiveUnitContext';
import { useTarefasPessoais, TarefaPessoal } from '@/hooks/use-tarefas-pessoais';
import { useListaAulasExperimentais } from '@/hooks/use-lista-aulas-experimentais';
import { useListaReposicoes } from '@/hooks/use-lista-reposicoes';
import { useProfessorAtividades } from '@/hooks/use-professor-atividades';
import { useProximasColetasAH } from '@/hooks/use-proximas-coletas-ah';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useCamisetas } from '@/hooks/use-camisetas';
import { useApostilasRecolhidas } from '@/hooks/use-apostilas-recolhidas';
import { useAniversariantes } from '@/hooks/use-aniversariantes';
import { useAtividadesEvasaoHome } from '@/hooks/use-atividades-evasao-home';
import { useAulasInauguraisProfessor } from '@/hooks/use-aulas-inaugurais-professor';
import { usePosMatriculasIncompletas } from '@/hooks/use-pos-matriculas-incompletas';
import { useAlunosIgnoradosAH } from '@/hooks/use-alunos-ignorados-ah';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Calendar, ClipboardList, Users, RefreshCw, Trash2, Loader2, Shirt, BookOpen, AlertTriangle, Cake, UserX, GraduationCap, FileText, Award, Filter, ChevronDown, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CamisetaEntregueModal } from '@/components/camisetas/CamisetaEntregueModal';
import { RecolherApostilaUnicaModal } from '@/components/abrindo-horizontes/RecolherApostilaUnicaModal';
import { EntregaAhModal } from '@/components/abrindo-horizontes/EntregaAhModal';
import { AtividadesDrawer } from '@/components/alerta-evasao/AtividadesDrawer';
import { EntregaBotomModal } from '@/components/botom/EntregaBotomModal';
import { usePendenciasBotom } from '@/hooks/use-pendencias-botom';
import { ConcluirAniversarioModal } from '@/components/home/ConcluirAniversarioModal';
import { AlertaEvasao } from '@/hooks/use-alertas-evasao-lista';
import { supabase } from '@/integrations/supabase/client';
// Interface para eventos com dados extras
interface Evento {
  tipo: string;
  titulo: string;
  data: string;
  subtitulo?: string;
  aluno_id?: string;
  aluno_nome?: string;
  pessoa_id?: string;
  pessoa_nome?: string;
  pessoa_origem?: 'aluno' | 'funcionario';
  apostila_recolhida_id?: string;
  apostila_nome?: string;
  turma_nome?: string;
  educador_nome?: string;
  // Campos para alerta de evasão
  alerta_evasao_id?: string;
  atividade_evasao_id?: string;
  tipo_atividade_evasao?: string;
  // Campos para pós-matrícula incompleta
  pos_matricula_client_id?: string;
  // Campos para aniversário
  aniversario_mes_dia?: string;
  // Campos para entrega de botom
  pendencia_botom_id?: string;
  apostila_nova?: string;
}

export default function Home() {
  const { profile } = useAuth();
  const { activeUnit } = useActiveUnit();
  const navigate = useNavigate();
  const hoje = new Date();
  
  // Datas para os períodos
  const hojeStr = format(hoje, 'yyyy-MM-dd');
  const inicioSemana = startOfWeek(hoje, { weekStartsOn: 0 });
  const fimSemana = endOfWeek(hoje, { weekStartsOn: 0 });
  const inicioProximaSemana = startOfWeek(addWeeks(hoje, 1), { weekStartsOn: 0 });
  const fimProximaSemana = endOfWeek(addWeeks(hoje, 1), { weekStartsOn: 0 });

  // Buscar tarefas pessoais (todas)
  const { tarefas, isLoading: loadingTarefas, criarTarefa, toggleConcluida, deletarTarefa } = useTarefasPessoais();

  // Buscar eventos do sistema
  const { aulasExperimentais = [] } = useListaAulasExperimentais();
  const { reposicoes = [] } = useListaReposicoes();

  // Buscar atividades específicas do professor
  const { 
    isProfessor, 
    isLoading: loadingProfessor,
    reposicoes: reposicoesProfessor,
    camisetasPendentes,
    apostilasAHProntas,
    apostilasAHParaCorrigir,
    coletasAHPendentes,
    botomPendentes,
    isDiaHoje,
    isDiaSemana,
  } = useProfessorAtividades();

  // Buscar aulas inaugurais do professor
  const { aulasInaugurais } = useAulasInauguraisProfessor();

  // Buscar coletas AH pendentes (para admins)
  const { data: todasColetasAH = [], isLoading: loadingColetasAH } = useProximasColetasAH();
  
  // Buscar camisetas pendentes (para admins)
  const { alunos: todosCamisetas = [], loading: loadingCamisetas, marcarComoEntregueComDetalhes, refetch: refetchCamisetas } = useCamisetas();
  
  // Buscar apostilas AH prontas (para admins)
  const { data: todasApostilasRecolhidas = [], isLoading: loadingApostilas } = useApostilasRecolhidas();
  
  // Estado para modal de camiseta
  const [camisetaModalOpen, setCamisetaModalOpen] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<{ id: string; nome: string } | null>(null);
  
  // Estado para modal de coleta AH
  const [coletaAHModalOpen, setColetaAHModalOpen] = useState(false);
  const [pessoaSelecionadaAH, setPessoaSelecionadaAH] = useState<{
    id: string;
    nome: string;
    origem: 'aluno' | 'funcionario';
  } | null>(null);

  // Estado para modal de entrega AH (apostila pronta)
  const [entregaAHModalOpen, setEntregaAHModalOpen] = useState(false);
  const [apostilaSelecionadaEntrega, setApostilaSelecionadaEntrega] = useState<{
    id: string;
    apostilaNome: string;
    pessoaNome: string;
  } | null>(null);

  // Estado para drawer de atividades de evasão
  const [drawerEvasaoAberto, setDrawerEvasaoAberto] = useState(false);
  const [alertaSelecionado, setAlertaSelecionado] = useState<AlertaEvasao | null>(null);
  
  // Buscar aniversariantes
  const { data: aniversariantes, refetch: refetchAniversariantes } = useAniversariantes(activeUnit?.id);
  
  // Estado para modal de aniversário
  const [aniversarioModalOpen, setAniversarioModalOpen] = useState(false);
  const [aniversariantesSelecionado, setAniversariantesSelecionado] = useState<{
    id: string;
    nome: string;
    aniversario_mes_dia: string;
  } | null>(null);

  // Estado para modal de entrega de botom
  const [botomModalOpen, setBotomModalOpen] = useState(false);
  const [botomSelecionado, setBotomSelecionado] = useState<{
    pendenciaId: string;
    alunoNome: string;
    apostilaNova: string;
  } | null>(null);

  // Tipos de atividades disponíveis para filtro
  const tiposAtividades = useMemo(() => [
    { key: 'aniversario', label: 'Aniversários', icon: Cake, color: 'text-pink-500' },
    { key: 'pos_matricula', label: 'Pós-Matrícula', icon: FileText, color: 'text-cyan-600' },
    { key: 'aula_inaugural', label: 'Aulas Inaugurais', icon: GraduationCap, color: 'text-emerald-600' },
    { key: 'alerta_evasao', label: 'Evasão', icon: UserX, color: 'text-destructive' },
    { key: 'botom_pendente', label: 'Botom', icon: Award, color: 'text-amber-500' },
    { key: 'coleta_ah', label: 'AH - Coletar', icon: AlertTriangle, color: 'text-red-500' },
    { key: 'corrigir_ah', label: 'AH - Corrigir', icon: BookOpen, color: 'text-blue-500' },
    { key: 'entrega_ah', label: 'AH - Entregar', icon: BookOpen, color: 'text-green-500' },
    { key: 'camiseta', label: 'Camisetas', icon: Shirt, color: 'text-purple-500' },
    { key: 'reposicao', label: 'Reposições', icon: RefreshCw, color: 'text-orange-500' },
    { key: 'aula_experimental', label: 'Aulas Experimentais', icon: Users, color: 'text-blue-500' },
  ], []);

  // Estado para filtros de tipos selecionados (todos selecionados por padrão)
  const [tiposSelecionados, setTiposSelecionados] = useState<Set<string>>(
    new Set(tiposAtividades.map(t => t.key))
  );

  // Toggle de tipo de atividade
  const toggleTipo = (tipo: string) => {
    setTiposSelecionados(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tipo)) {
        newSet.delete(tipo);
      } else {
        newSet.add(tipo);
      }
      return newSet;
    });
  };

  // Selecionar/deselecionar todos
  const toggleTodos = () => {
    if (tiposSelecionados.size === tiposAtividades.length) {
      setTiposSelecionados(new Set());
    } else {
      setTiposSelecionados(new Set(tiposAtividades.map(t => t.key)));
    }
  };

  // Buscar pendências de botom (para admins e professores)
  const { pendencias: pendenciasBotom = [], refetch: refetchBotom } = usePendenciasBotom();
  
  // Buscar atividades de alerta de evasão pendentes
  const { data: atividadesEvasao = [], isLoading: loadingAtividadesEvasao, refetch: refetchAtividadesEvasao } = useAtividadesEvasaoHome();
  
  // Permissões do usuário
  const { isAdmin, isManagement, isAdministrativo } = useUserPermissions();
  
  // Buscar pós-matrículas incompletas (para admins e administrativo)
  const { data: posMatriculasIncompletas = [], isLoading: loadingPosMatriculas } = usePosMatriculasIncompletas();
  
  // Buscar pessoas ignoradas para filtrar atividades AH
  const { data: pessoasIgnoradas = [] } = useAlunosIgnoradosAH();
  const idsIgnorados = new Set(pessoasIgnoradas.map(p => p.pessoa_id));
  
  // Filtrar coletas com mais de 90 dias para admins (excluindo ignorados)
  const coletasAHAdmins = todasColetasAH.filter(c => 
    c.dias_desde_ultima_correcao !== null && 
    c.dias_desde_ultima_correcao >= 90 &&
    !idsIgnorados.has(c.id)
  );
  
  // Filtrar camisetas pendentes (>60 dias e não entregues) para admins
  const camisetasAdmins = todosCamisetas.filter(c => 
    !c.camiseta_entregue && !c.nao_tem_tamanho && (c.dias_supera || 0) >= 60
  );
  
  // Filtrar apostilas prontas para entregar (com correções) e para corrigir (sem correções) para admins (excluindo ignorados)
  const apostilasProntasAdmins = todasApostilasRecolhidas.filter(a => 
    !a.foi_entregue && a.total_correcoes > 0 && !idsIgnorados.has(a.pessoa_id)
  );
  const apostilasParaCorrigirAdmins = todasApostilasRecolhidas.filter(a => 
    !a.foi_entregue && !a.correcao_iniciada && !idsIgnorados.has(a.pessoa_id)
  );

  // Estado para nova tarefa
  const [novaTarefaOpen, setNovaTarefaOpen] = useState(false);
  const [novaTarefa, setNovaTarefa] = useState({
    titulo: '',
    descricao: '',
    data_vencimento: hojeStr,
    prioridade: 'normal' as 'baixa' | 'normal' | 'alta',
  });

  // Filtrar tarefas por período
  const tarefasAtrasadas = tarefas.filter(t => !t.concluida && t.data_vencimento < hojeStr);
  const tarefasHoje = tarefas.filter(t => t.data_vencimento === hojeStr);
  const tarefasSemana = tarefas.filter(t => {
    const data = parseISO(t.data_vencimento);
    return isSameWeek(data, hoje, { weekStartsOn: 0 }) && t.data_vencimento !== hojeStr;
  });
  const tarefasProximaSemana = tarefas.filter(t => {
    const data = parseISO(t.data_vencimento);
    return isSameWeek(data, inicioProximaSemana, { weekStartsOn: 0 });
  });

  // Helper para obter label do tipo de atividade de evasão
  const getTipoAtividadeLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'acolhimento': 'Acolhimento',
      'atendimento_pedagogico': 'Atend. Pedagógico',
      'atendimento_financeiro': 'Atend. Financeiro',
      'remover_sgs': 'Remover SGS',
      'evasao': 'Evasão',
      'tarefa_admin': 'Tarefa Admin',
    };
    return labels[tipo] || tipo;
  };

  // Helper para categorizar evento de evasão por data
  const categorizarEventoEvasao = (
    atividade: typeof atividadesEvasao[0],
    eventosAtrasados: Evento[],
    eventosHoje: Evento[],
    eventosSemana: Evento[],
    eventosProximaSemana: Evento[]
  ) => {
    // Validar que data_referencia existe antes de processar
    if (!atividade.data_referencia) {
      console.warn('Atividade de evasão sem data_referencia:', atividade.id);
      return;
    }

    const evento: Evento = {
      tipo: 'alerta_evasao',
      titulo: `${getTipoAtividadeLabel(atividade.tipo_atividade)}: ${atividade.aluno_nome}`,
      data: atividade.data_referencia,
      subtitulo: atividade.turma_nome || 'Sem turma',
      aluno_id: atividade.aluno_id,
      aluno_nome: atividade.aluno_nome,
      alerta_evasao_id: atividade.alerta_evasao_id,
      atividade_evasao_id: atividade.id,
      tipo_atividade_evasao: atividade.tipo_atividade,
    };

    // Usar data_referencia (que é data_agendada ou created_at)
    const dataReferencia = parseISO(atividade.data_referencia);
    const hojeInicio = startOfDay(hoje);
    
    if (isBefore(dataReferencia, hojeInicio)) {
      eventosAtrasados.push(evento);
    } else if (atividade.data_referencia === hojeStr) {
      eventosHoje.push(evento);
    } else if (isSameWeek(dataReferencia, hoje, { weekStartsOn: 0 })) {
      eventosSemana.push(evento);
    } else if (isSameWeek(dataReferencia, inicioProximaSemana, { weekStartsOn: 0 })) {
      eventosProximaSemana.push(evento);
    }
  };

  // Montar eventos baseado no perfil (admin, professor ou outros)
  const montarEventos = () => {
    // Para admins/gestores: mostrar todas as atividades
    if (isAdmin || isManagement) {
      const eventosAtrasados: Evento[] = [];
      const eventosHoje: Evento[] = [];
      const eventosSemana: Evento[] = [];
      const eventosProximaSemana: Evento[] = [];

      // === ATIVIDADES DE ALERTA DE EVASÃO ===
      atividadesEvasao.forEach(atividade => {
        categorizarEventoEvasao(atividade, eventosAtrasados, eventosHoje, eventosSemana, eventosProximaSemana);
      });

      // === EVENTOS ATRASADOS ===
      
      // Coletas AH pendentes (+90 dias)
      coletasAHAdmins.forEach(c => {
        eventosAtrasados.push({
          tipo: 'coleta_ah',
          titulo: `Coleta AH: ${c.nome}`,
          data: '',
          subtitulo: `${c.dias_desde_ultima_correcao} dias - ${c.professor_nome || 'Sem professor'}`,
          pessoa_id: c.id,
          pessoa_nome: c.nome,
          pessoa_origem: c.origem,
        });
      });
      
      // Camisetas pendentes
      camisetasAdmins.forEach(c => {
        eventosAtrasados.push({
          tipo: 'camiseta',
          titulo: `Camiseta: ${c.nome}`,
          data: '',
          subtitulo: `${c.dias_supera} dias - ${c.professor_nome || 'Sem professor'}`,
          aluno_id: c.id,
          aluno_nome: c.nome,
        });
      });
      
      // Apostilas AH prontas para entregar (corrigidas e não entregues)
      apostilasProntasAdmins.forEach(a => {
        eventosAtrasados.push({
          tipo: 'entrega_ah',
          titulo: `Entregar AH: ${a.pessoa_nome}`,
          data: '',
          subtitulo: `${a.apostila} - ${a.professor_nome || 'Sem professor'}`,
          apostila_recolhida_id: a.id,
          apostila_nome: a.apostila,
          pessoa_nome: a.pessoa_nome,
        });
      });
      
      // Apostilas AH para corrigir (recolhidas sem correção iniciada)
      apostilasParaCorrigirAdmins.forEach(a => {
        eventosAtrasados.push({
          tipo: 'corrigir_ah',
          titulo: `Corrigir AH: ${a.pessoa_nome}`,
          data: '',
          subtitulo: `${a.apostila} - ${a.professor_nome || 'Sem professor'}`,
          apostila_recolhida_id: a.id,
          apostila_nome: a.apostila,
          pessoa_nome: a.pessoa_nome,
        });
      });
      
      // Pendências de botom (entregas pendentes)
      pendenciasBotom.forEach(b => {
        eventosAtrasados.push({
          tipo: 'botom_pendente',
          titulo: `Botom: ${b.aluno_nome}`,
          data: b.data_criacao,
          subtitulo: `Avançou para ${b.apostila_nova} - ${b.professor_nome || 'Sem professor'}`,
          aluno_id: b.aluno_id,
          aluno_nome: b.aluno_nome,
          pendencia_botom_id: b.id,
          apostila_nova: b.apostila_nova,
        });
      });
      
      // Pós-matrículas incompletas (para admins e administrativo)
      posMatriculasIncompletas.forEach(pm => {
        const pendentes: string[] = [];
        if (!pm.cadastrais_completo) pendentes.push('Cadastrais');
        if (!pm.comerciais_completo) pendentes.push('Comerciais');
        if (!pm.pedagogicos_completo) pendentes.push('Pedagógicos');
        
        eventosAtrasados.push({
          tipo: 'pos_matricula',
          titulo: `Pós-Matrícula: ${pm.client_name}`,
          data: pm.data_matricula,
          subtitulo: `Faltam: ${pendentes.join(', ')}`,
          pos_matricula_client_id: pm.client_id,
        });
      });

      // === AULAS INAUGURAIS (admin) ===
      aulasInaugurais.forEach(ai => {
        const evento: Evento = {
          tipo: 'aula_inaugural',
          titulo: `Aula Inaugural${ai.cliente_nome ? `: ${ai.cliente_nome}` : ''}`,
          data: ai.data,
          subtitulo: `${ai.horario_inicio.slice(0, 5)} - ${ai.horario_fim.slice(0, 5)}${ai.professor_nome ? ` • ${ai.professor_nome}` : ''}`,
        };
        if (ai.data === hojeStr) {
          eventosHoje.push(evento);
        } else {
          const dataAi = parseISO(ai.data);
          if (isSameWeek(dataAi, hoje, { weekStartsOn: 0 })) {
            eventosSemana.push(evento);
          } else if (isSameWeek(dataAi, inicioProximaSemana, { weekStartsOn: 0 })) {
            eventosProximaSemana.push(evento);
          }
        }
      });

      // Aulas experimentais
      aulasExperimentais.forEach(ae => {
        const evento: Evento = {
          tipo: 'aula_experimental',
          titulo: `Aula Experimental: ${ae.cliente_nome}`,
          data: ae.data_aula_experimental,
          turma_nome: ae.turma_nome,
          educador_nome: ae.responsavel_nome,
        };
        if (ae.data_aula_experimental === hojeStr) {
          eventosHoje.push(evento);
        } else {
          const dataAe = parseISO(ae.data_aula_experimental);
          if (isSameWeek(dataAe, hoje, { weekStartsOn: 0 })) {
            eventosSemana.push(evento);
          } else if (isSameWeek(dataAe, inicioProximaSemana, { weekStartsOn: 0 })) {
            eventosProximaSemana.push(evento);
          }
        }
      });

      // Reposições
      reposicoes.forEach(r => {
        const evento: Evento = {
          tipo: 'reposicao',
          titulo: `Reposição: ${r.aluno_nome}`,
          data: r.data_reposicao,
          turma_nome: r.turma_reposicao_nome,
          educador_nome: r.turma_reposicao_professor,
        };
        if (r.data_reposicao === hojeStr) {
          eventosHoje.push(evento);
        } else {
          const dataRepo = parseISO(r.data_reposicao);
          if (isSameWeek(dataRepo, hoje, { weekStartsOn: 0 })) {
            eventosSemana.push(evento);
          } else if (isSameWeek(dataRepo, inicioProximaSemana, { weekStartsOn: 0 })) {
            eventosProximaSemana.push(evento);
          }
        }
      });

      // Aniversariantes de hoje
      aniversariantes?.aniversariantesHoje?.forEach(a => {
        eventosHoje.push({
          tipo: 'aniversario',
          titulo: a.nome,
          data: '',
          subtitulo: 'Aniversário hoje! 🎉',
          aluno_id: a.id,
          aluno_nome: a.nome,
          aniversario_mes_dia: a.aniversario_mes_dia,
        });
      });

      // Aniversariantes da semana
      aniversariantes?.aniversariantesSemana?.forEach(a => {
        eventosSemana.push({
          tipo: 'aniversario',
          titulo: a.nome,
          data: '',
          subtitulo: `Aniversário: ${a.aniversario_mes_dia}`,
          aluno_id: a.id,
          aluno_nome: a.nome,
          aniversario_mes_dia: a.aniversario_mes_dia,
        });
      });

      return { eventosAtrasados, eventosHoje, eventosSemana, eventosProximaSemana };
    }
    
    if (isProfessor) {
      // Para professores: usar apenas atividades das suas turmas
      const eventosAtrasados: Evento[] = [];
      const eventosHoje: Evento[] = [];
      const eventosSemana: Evento[] = [];
      const eventosProximaSemana: Evento[] = [];

      // === ATIVIDADES DE ALERTA DE EVASÃO DO PROFESSOR ===
      atividadesEvasao.forEach(atividade => {
        categorizarEventoEvasao(atividade, eventosAtrasados, eventosHoje, eventosSemana, eventosProximaSemana);
      });

      // === AULAS INAUGURAIS DO PROFESSOR ===
      aulasInaugurais.forEach(ai => {
        const evento: Evento = {
          tipo: 'aula_inaugural',
          titulo: `Aula Inaugural${ai.cliente_nome ? `: ${ai.cliente_nome}` : ''}`,
          data: ai.data,
          subtitulo: `${ai.horario_inicio.slice(0, 5)} - ${ai.horario_fim.slice(0, 5)}`,
        };
        if (ai.data === hojeStr) {
          eventosHoje.push(evento);
        } else {
          const dataAi = parseISO(ai.data);
          if (isSameWeek(dataAi, hoje, { weekStartsOn: 0 })) {
            eventosSemana.push(evento);
          } else if (isSameWeek(dataAi, inicioProximaSemana, { weekStartsOn: 0 })) {
            eventosProximaSemana.push(evento);
          }
        }
      });

      // Reposições do professor
      reposicoesProfessor.forEach(r => {
        const evento: Evento = {
          tipo: 'reposicao',
          titulo: `Reposição: ${r.aluno_nome}`,
          data: r.data_reposicao,
          turma_nome: r.turma_reposicao_nome,
        };
        if (r.data_reposicao === hojeStr) {
          eventosHoje.push(evento);
        } else {
          const dataRepo = parseISO(r.data_reposicao);
          if (isSameWeek(dataRepo, hoje, { weekStartsOn: 0 })) {
            eventosSemana.push(evento);
          }
        }
      });

      // Camisetas pendentes (+60 dias) -> atrasadas
      camisetasPendentes.forEach(c => {
        eventosAtrasados.push({
          tipo: 'camiseta',
          titulo: `Camiseta: ${c.aluno_nome}`,
          data: '',
          subtitulo: `${c.dias_supera} dias no Supera`,
          aluno_id: c.aluno_id,
          aluno_nome: c.aluno_nome,
        });
      });

      // Apostilas AH prontas para entregar -> atrasadas
      apostilasAHProntas.forEach(a => {
        eventosAtrasados.push({
          tipo: 'entrega_ah',
          titulo: `Entregar AH: ${a.pessoa_nome}`,
          data: '',
          subtitulo: `${a.apostila} - Pronta para entregar`,
          apostila_recolhida_id: a.id.toString(),
          apostila_nome: a.apostila,
          pessoa_nome: a.pessoa_nome,
        });
      });

      // Apostilas AH para corrigir -> atrasadas
      apostilasAHParaCorrigir.forEach(a => {
        eventosAtrasados.push({
          tipo: 'corrigir_ah',
          titulo: `Corrigir AH: ${a.pessoa_nome}`,
          data: '',
          subtitulo: `${a.apostila} - Aguarda correção`,
          apostila_recolhida_id: a.id.toString(),
          apostila_nome: a.apostila,
          pessoa_nome: a.pessoa_nome,
        });
      });

      // Coletas AH pendentes (+90 dias) -> atrasadas
      coletasAHPendentes.forEach(c => {
        eventosAtrasados.push({
          tipo: 'coleta_ah',
          titulo: `Coleta AH: ${c.pessoa_nome}`,
          data: '',
          subtitulo: `${c.dias_sem_correcao} dias sem correção`,
          pessoa_id: c.pessoa_id,
          pessoa_nome: c.pessoa_nome,
          pessoa_origem: 'aluno' as const,
        });
      });

      // Botom pendentes -> atrasadas
      botomPendentes.forEach(b => {
        eventosAtrasados.push({
          tipo: 'botom_pendente',
          titulo: `Botom: ${b.aluno_nome}`,
          data: '',
          subtitulo: `Avançou para ${b.apostila_nova}`,
          aluno_id: b.aluno_id,
          aluno_nome: b.aluno_nome,
          pendencia_botom_id: b.pendencia_id,
          apostila_nova: b.apostila_nova,
        });
      });

      // Aniversariantes de hoje (professor)
      aniversariantes?.aniversariantesHoje?.forEach(a => {
        eventosHoje.push({
          tipo: 'aniversario',
          titulo: a.nome,
          data: '',
          subtitulo: 'Aniversário hoje! 🎉',
          aluno_id: a.id,
          aluno_nome: a.nome,
          aniversario_mes_dia: a.aniversario_mes_dia,
        });
      });

      // Aniversariantes da semana (professor)
      aniversariantes?.aniversariantesSemana?.forEach(a => {
        eventosSemana.push({
          tipo: 'aniversario',
          titulo: a.nome,
          data: '',
          subtitulo: `Aniversário: ${a.aniversario_mes_dia}`,
          aluno_id: a.id,
          aluno_nome: a.nome,
          aniversario_mes_dia: a.aniversario_mes_dia,
        });
      });

      return { eventosAtrasados, eventosHoje, eventosSemana, eventosProximaSemana };
    } else if (isAdministrativo) {
      // Para setor administrativo: mostrar pós-matrículas incompletas
      const eventosAtrasados: Evento[] = [];
      const eventosHoje: Evento[] = [];
      const eventosSemana: Evento[] = [];
      const eventosProximaSemana: Evento[] = [];

      // Pós-matrículas incompletas
      posMatriculasIncompletas.forEach(pm => {
        const pendentes: string[] = [];
        if (!pm.cadastrais_completo) pendentes.push('Cadastrais');
        if (!pm.comerciais_completo) pendentes.push('Comerciais');
        if (!pm.pedagogicos_completo) pendentes.push('Pedagógicos');
        
        eventosAtrasados.push({
          tipo: 'pos_matricula',
          titulo: `Pós-Matrícula: ${pm.client_name}`,
          data: pm.data_matricula,
          subtitulo: `Faltam: ${pendentes.join(', ')}`,
          pos_matricula_client_id: pm.client_id,
        });
      });

      // Aniversariantes
      aniversariantes?.aniversariantesHoje?.forEach(a => {
        eventosHoje.push({
          tipo: 'aniversario',
          titulo: a.nome,
          data: '',
          subtitulo: 'Aniversário hoje! 🎉',
          aluno_id: a.id,
          aluno_nome: a.nome,
          aniversario_mes_dia: a.aniversario_mes_dia,
        });
      });

      aniversariantes?.aniversariantesSemana?.forEach(a => {
        eventosSemana.push({
          tipo: 'aniversario',
          titulo: a.nome,
          data: '',
          subtitulo: `Aniversário: ${a.aniversario_mes_dia}`,
          aluno_id: a.id,
          aluno_nome: a.nome,
          aniversario_mes_dia: a.aniversario_mes_dia,
        });
      });

      return { eventosAtrasados, eventosHoje, eventosSemana, eventosProximaSemana };
    } else {
      // Para não-professores: comportamento original
      const eventosHoje: Evento[] = [
        ...aulasExperimentais.filter(ae => ae.data_aula_experimental === hojeStr).map(ae => ({
          tipo: 'aula_experimental' as const,
          titulo: `Aula Experimental: ${ae.cliente_nome}`,
          data: ae.data_aula_experimental,
          turma_nome: ae.turma_nome,
          educador_nome: ae.responsavel_nome,
        })),
        ...reposicoes.filter(r => r.data_reposicao === hojeStr).map(r => ({
          tipo: 'reposicao' as const,
          titulo: `Reposição: ${r.aluno_nome}`,
          data: r.data_reposicao,
          turma_nome: r.turma_reposicao_nome,
          educador_nome: r.turma_reposicao_professor,
        })),
      ];

      const eventosSemana: Evento[] = [
        ...aulasExperimentais.filter(ae => {
          const data = parseISO(ae.data_aula_experimental);
          return isSameWeek(data, hoje, { weekStartsOn: 0 }) && ae.data_aula_experimental !== hojeStr;
        }).map(ae => ({
          tipo: 'aula_experimental' as const,
          titulo: `Aula Experimental: ${ae.cliente_nome}`,
          data: ae.data_aula_experimental,
          turma_nome: ae.turma_nome,
          educador_nome: ae.responsavel_nome,
        })),
        ...reposicoes.filter(r => {
          const data = parseISO(r.data_reposicao);
          return isSameWeek(data, hoje, { weekStartsOn: 0 }) && r.data_reposicao !== hojeStr;
        }).map(r => ({
          tipo: 'reposicao' as const,
          educador_nome: r.turma_reposicao_professor,
          titulo: `Reposição: ${r.aluno_nome}`,
          data: r.data_reposicao,
          turma_nome: r.turma_reposicao_nome,
        })),
      ];

      const eventosProximaSemana: Evento[] = [
        ...aulasExperimentais.filter(ae => {
          const data = parseISO(ae.data_aula_experimental);
          return isSameWeek(data, inicioProximaSemana, { weekStartsOn: 0 });
        }).map(ae => ({
          tipo: 'aula_experimental' as const,
          titulo: `Aula Experimental: ${ae.cliente_nome}`,
          data: ae.data_aula_experimental,
          turma_nome: ae.turma_nome,
          educador_nome: ae.responsavel_nome,
        })),
        ...reposicoes.filter(r => {
          const data = parseISO(r.data_reposicao);
          return isSameWeek(data, inicioProximaSemana, { weekStartsOn: 0 });
        }).map(r => ({
          tipo: 'reposicao' as const,
          educador_nome: r.turma_reposicao_professor,
          titulo: `Reposição: ${r.aluno_nome}`,
          data: r.data_reposicao,
          turma_nome: r.turma_reposicao_nome,
        })),
      ];

      // Aniversariantes para não-professores
      const eventosHojeComAniversarios = [
        ...eventosHoje,
        ...(aniversariantes?.aniversariantesHoje || []).map(a => ({
          tipo: 'aniversario' as const,
          titulo: a.nome,
          data: '',
          subtitulo: 'Aniversário hoje! 🎉',
          aluno_id: a.id,
          aluno_nome: a.nome,
          aniversario_mes_dia: a.aniversario_mes_dia,
        })),
      ];

      const eventosSemanaComAniversarios = [
        ...eventosSemana,
        ...(aniversariantes?.aniversariantesSemana || []).map(a => ({
          tipo: 'aniversario' as const,
          titulo: a.nome,
          data: '',
          subtitulo: `Aniversário: ${a.aniversario_mes_dia}`,
          aluno_id: a.id,
          aluno_nome: a.nome,
          aniversario_mes_dia: a.aniversario_mes_dia,
        })),
      ];

      return { eventosAtrasados: [], eventosHoje: eventosHojeComAniversarios, eventosSemana: eventosSemanaComAniversarios, eventosProximaSemana };
    }
  };

  const { eventosAtrasados: eventosAtrasadosRaw, eventosHoje: eventosHojeRaw, eventosSemana: eventosSemanaRaw, eventosProximaSemana: eventosProximaSemanaRaw } = montarEventos();

  // Aplicar filtro de tipos de atividades
  const filtrarEventos = (eventos: Evento[]) => eventos.filter(e => tiposSelecionados.has(e.tipo));
  const eventosAtrasados = filtrarEventos(eventosAtrasadosRaw);
  const eventosHoje = filtrarEventos(eventosHojeRaw);
  const eventosSemana = filtrarEventos(eventosSemanaRaw);
  const eventosProximaSemana = filtrarEventos(eventosProximaSemanaRaw);

  const handleCriarTarefa = async () => {
    if (!novaTarefa.titulo.trim()) return;
    
    await criarTarefa.mutateAsync({
      titulo: novaTarefa.titulo,
      descricao: novaTarefa.descricao || null,
      data_vencimento: novaTarefa.data_vencimento,
      prioridade: novaTarefa.prioridade,
      concluida: false,
    });
    
    setNovaTarefa({
      titulo: '',
      descricao: '',
      data_vencimento: hojeStr,
      prioridade: 'normal',
    });
    setNovaTarefaOpen(false);
  };

  const getPrioridadeBadge = (prioridade: string) => {
    switch (prioridade) {
      case 'alta':
        return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Alta</Badge>;
      case 'baixa':
        return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Baixa</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0">Normal</Badge>;
    }
  };

  const renderTarefa = (tarefa: TarefaPessoal) => (
    <div
      key={tarefa.id}
      className={`flex items-center gap-2 p-2 rounded-md border transition-colors ${
        tarefa.concluida ? 'bg-muted/50 opacity-60' : 'bg-card hover:bg-muted/30'
      }`}
    >
      <Checkbox
        checked={tarefa.concluida}
        onCheckedChange={(checked) => toggleConcluida.mutate({ id: tarefa.id, concluida: !!checked })}
        className="h-3.5 w-3.5"
      />
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium ${tarefa.concluida ? 'line-through text-muted-foreground' : ''}`}>
          {tarefa.titulo}
        </p>
        {tarefa.descricao && (
          <p className="text-[10px] text-muted-foreground truncate">{tarefa.descricao}</p>
        )}
      </div>
      {getPrioridadeBadge(tarefa.prioridade)}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-muted-foreground hover:text-destructive"
        onClick={() => deletarTarefa.mutate(tarefa.id)}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );

  const getEventoIcon = (tipo: string) => {
    switch (tipo) {
      case 'aula_experimental':
        return <Users className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />;
      case 'reposicao':
        return <RefreshCw className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />;
      case 'camiseta':
        return <Shirt className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />;
      case 'entrega_ah':
        return <BookOpen className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />;
      case 'corrigir_ah':
        return <BookOpen className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />;
      case 'coleta_ah':
        return <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />;
      case 'aniversario':
        return <Cake className="h-3.5 w-3.5 text-pink-500 flex-shrink-0" />;
      case 'alerta_evasao':
        return <UserX className="h-3.5 w-3.5 text-destructive flex-shrink-0" />;
      case 'aula_inaugural':
        return <GraduationCap className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />;
      case 'pos_matricula':
        return <FileText className="h-3.5 w-3.5 text-cyan-600 flex-shrink-0" />;
      case 'botom_pendente':
        return <Award className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />;
      default:
        return <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />;
    }
  };

  const getEventoBadge = (tipo: string, tipoAtividade?: string) => {
    switch (tipo) {
      case 'aula_experimental':
        return <Badge className="text-[10px] px-1.5 py-0 text-primary-foreground">Aula</Badge>;
      case 'reposicao':
        return <Badge className="text-[10px] px-1.5 py-0 bg-purple-500 text-white">Repos.</Badge>;
      case 'camiseta':
        return <Badge className="text-[10px] px-1.5 py-0 bg-purple-500 text-white">Camiseta</Badge>;
      case 'entrega_ah':
        return <Badge className="text-[10px] px-1.5 py-0 bg-green-500 text-white">Entregar</Badge>;
      case 'corrigir_ah':
        return <Badge className="text-[10px] px-1.5 py-0 bg-blue-500 text-white">Corrigir</Badge>;
      case 'coleta_ah':
        return <Badge className="text-[10px] px-1.5 py-0 bg-red-500 text-white">Coletar</Badge>;
      case 'aniversario':
        return <Badge className="text-[10px] px-1.5 py-0 bg-pink-500 text-white">Aniver.</Badge>;
      case 'alerta_evasao':
        // Badge colorido por tipo de atividade
        const badgeColors: Record<string, string> = {
          'acolhimento': 'bg-blue-500',
          'atendimento_pedagogico': 'bg-orange-500',
          'atendimento_financeiro': 'bg-violet-500',
          'remover_sgs': 'bg-slate-500',
          'evasao': 'bg-destructive',
          'tarefa_admin': 'bg-amber-500',
        };
        const color = badgeColors[tipoAtividade || ''] || 'bg-destructive';
        return <Badge className={`text-[10px] px-1.5 py-0 ${color} text-white`}>Evasão</Badge>;
      case 'aula_inaugural':
        return <Badge className="text-[10px] px-1.5 py-0 bg-emerald-600 text-white">Inaugural</Badge>;
      case 'pos_matricula':
        return <Badge className="text-[10px] px-1.5 py-0 bg-cyan-600 text-white">Pós-Mat.</Badge>;
      case 'botom_pendente':
        return <Badge className="text-[10px] px-1.5 py-0 bg-amber-500 text-white">Botom</Badge>;
      default:
        return null;
    }
  };

  const handleAlertaEvasaoClick = async (evento: Evento) => {
    if (evento.alerta_evasao_id) {
      // Buscar dados completos do alerta para o drawer
      const { data: alertaData } = await supabase
        .from('alerta_evasao')
        .select(`
          *,
          aluno:alunos!inner(
            id, nome, foto_url, active,
            turma:turmas(id, nome, professor:professores(id, nome))
          )
        `)
        .eq('id', evento.alerta_evasao_id)
        .single();
      
      if (alertaData) {
        setAlertaSelecionado(alertaData as unknown as AlertaEvasao);
        setDrawerEvasaoAberto(true);
      }
    }
  };

  const handleCamisetaClick = (evento: Evento) => {
    if (evento.aluno_id && evento.aluno_nome) {
      setAlunoSelecionado({ id: evento.aluno_id, nome: evento.aluno_nome });
      setCamisetaModalOpen(true);
    }
  };

  const handleColetaAHClick = (evento: Evento) => {
    if (evento.pessoa_id && evento.pessoa_nome && evento.pessoa_origem) {
      setPessoaSelecionadaAH({
        id: evento.pessoa_id,
        nome: evento.pessoa_nome,
        origem: evento.pessoa_origem,
      });
      setColetaAHModalOpen(true);
    }
  };

  const handleAHProntaClick = (evento: Evento) => {
    if (evento.apostila_recolhida_id && evento.apostila_nome && evento.pessoa_nome) {
      setApostilaSelecionadaEntrega({
        id: evento.apostila_recolhida_id,
        apostilaNome: evento.apostila_nome,
        pessoaNome: evento.pessoa_nome,
      });
      setEntregaAHModalOpen(true);
    }
  };

  const handleAniversarioClick = (evento: Evento) => {
    if (evento.aluno_id && evento.aluno_nome && evento.aniversario_mes_dia) {
      setAniversariantesSelecionado({
        id: evento.aluno_id,
        nome: evento.aluno_nome,
        aniversario_mes_dia: evento.aniversario_mes_dia,
      });
      setAniversarioModalOpen(true);
    }
  };

  const handleBotomClick = (evento: Evento) => {
    if (evento.pendencia_botom_id && evento.aluno_nome && evento.apostila_nova) {
      setBotomSelecionado({
        pendenciaId: evento.pendencia_botom_id,
        alunoNome: evento.aluno_nome,
        apostilaNova: evento.apostila_nova,
      });
      setBotomModalOpen(true);
    }
  };

  const handleSalvarCamiseta = async (dados: { 
    alunoId: string; 
    tamanho_camiseta: string; 
    data_entrega: Date; 
    observacoes?: string; 
    funcionario_registro_id?: string; 
    responsavel_nome?: string; 
  }) => {
    await marcarComoEntregueComDetalhes(dados);
    refetchCamisetas();
    setCamisetaModalOpen(false);
    setAlunoSelecionado(null);
  };

  const renderEvento = (evento: Evento, index: number) => {
    const isCamisetaClicavel = evento.tipo === 'camiseta' && evento.aluno_id;
    const isColetaAHClicavel = evento.tipo === 'coleta_ah' && evento.pessoa_id;
    const isAHProntaClicavel = (evento.tipo === 'entrega_ah' || evento.tipo === 'corrigir_ah') && evento.apostila_recolhida_id;
    const isAlertaEvasaoClicavel = evento.tipo === 'alerta_evasao' && evento.alerta_evasao_id;
    const isPosMatriculaClicavel = evento.tipo === 'pos_matricula' && evento.pos_matricula_client_id;
    const isAniversarioClicavel = evento.tipo === 'aniversario' && evento.aluno_id;
    const isBotomClicavel = evento.tipo === 'botom_pendente' && evento.pendencia_botom_id;
    const isClicavel = isCamisetaClicavel || isColetaAHClicavel || isAHProntaClicavel || isAlertaEvasaoClicavel || isPosMatriculaClicavel || isAniversarioClicavel || isBotomClicavel;
    
    const handleClick = () => {
      if (isCamisetaClicavel) {
        handleCamisetaClick(evento);
      } else if (isColetaAHClicavel) {
        handleColetaAHClick(evento);
      } else if (isAHProntaClicavel) {
        handleAHProntaClick(evento);
      } else if (isAlertaEvasaoClicavel) {
        handleAlertaEvasaoClick(evento);
      } else if (isPosMatriculaClicavel) {
        navigate('/painel-administrativo');
      } else if (isAniversarioClicavel) {
        handleAniversarioClick(evento);
      } else if (isBotomClicavel) {
        handleBotomClick(evento);
      }
    };
    
    return (
      <div
        key={`${evento.tipo}-${index}`}
        className={`flex items-center gap-2 p-2 rounded-md border bg-card ${
          isClicavel ? 'cursor-pointer hover:bg-accent transition-colors active:scale-[0.98]' : ''
        }`}
        onClick={isClicavel ? handleClick : undefined}
      >
        {getEventoIcon(evento.tipo)}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium">{evento.titulo}</p>
          <p className="text-[10px] text-muted-foreground">
            {evento.subtitulo || (
              (evento.tipo === 'reposicao' || evento.tipo === 'aula_experimental') 
                ? `${evento.data ? format(parseISO(evento.data), "EEE, dd/MM", { locale: ptBR }) : ''} • ${evento.turma_nome || ''}${evento.educador_nome ? ` • ${evento.educador_nome}` : ''}`
                : (evento.data ? format(parseISO(evento.data), "EEE, dd/MM", { locale: ptBR }) : '')
            )}
          </p>
        </div>
        {getEventoBadge(evento.tipo, evento.tipo_atividade_evasao)}
      </div>
    );
  };

  const renderSecaoAtividades = (
    titulo: string,
    periodo: string,
    tarefas: TarefaPessoal[],
    eventos: Evento[]
  ) => (
    <Card>
      <CardHeader className="py-2 px-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">{titulo}</CardTitle>
            <CardDescription className="text-[10px]">{periodo}</CardDescription>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <ClipboardList className="h-3 w-3" />
            <span>{tarefas.length}</span>
            <Calendar className="h-3 w-3 ml-1" />
            <span>{eventos.length}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0 space-y-1.5">
        {tarefas.length === 0 && eventos.length === 0 ? (
          <p className="text-[10px] text-muted-foreground text-center py-2">
            Nenhuma atividade para este período
          </p>
        ) : (
          <div className="space-y-1.5">
            {tarefas.map(renderTarefa)}
            {tarefas.length > 0 && eventos.length > 0 && <Separator className="my-1.5" />}
            {eventos.map(renderEvento)}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const isLoading = loadingTarefas || loadingProfessor || loadingAtividadesEvasao || (isAdmin && loadingColetasAH) || (isAdministrativo && loadingPosMatriculas);

  return (
    <div className="w-full space-y-3 px-4">
      {/* Header com saudação */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">
            Bem-vindo, {profile?.full_name?.split(' ')[0] || 'Usuário'}
          </h1>
          <p className="text-[10px] text-muted-foreground">
            {format(hoje, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>

        {/* Botões de ações */}
        <div className="flex items-center gap-2">
          {/* Filtro de Tipos */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1 px-2">
                <Filter className="h-3.5 w-3.5" />
                Filtrar
                {tiposSelecionados.size < tiposAtividades.length && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                    {tiposSelecionados.size}
                  </Badge>
                )}
                <ChevronDown className="h-3 w-3 ml-0.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="end">
              <div className="space-y-1">
                {/* Toggle todos */}
                <div
                  className="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer border-b pb-2 mb-1"
                  onClick={toggleTodos}
                >
                  <Checkbox
                    checked={tiposSelecionados.size === tiposAtividades.length}
                    className="h-3.5 w-3.5"
                  />
                  <span className="text-xs font-medium">
                    {tiposSelecionados.size === tiposAtividades.length ? 'Desmarcar todos' : 'Selecionar todos'}
                  </span>
                </div>
                
                {/* Lista de tipos */}
                {tiposAtividades.map(tipo => {
                  const Icon = tipo.icon;
                  return (
                    <div
                      key={tipo.key}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer"
                      onClick={() => toggleTipo(tipo.key)}
                    >
                      <Checkbox
                        checked={tiposSelecionados.has(tipo.key)}
                        className="h-3.5 w-3.5"
                      />
                      <Icon className={`h-3.5 w-3.5 ${tipo.color}`} />
                      <span className="text-xs">{tipo.label}</span>
                    </div>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          {/* Botão Nova Tarefa */}
          <Dialog open={novaTarefaOpen} onOpenChange={setNovaTarefaOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-7 text-xs gap-1 px-2">
                <Plus className="h-3.5 w-3.5" />
                Nova
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-[90vw] rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-base">Nova Tarefa</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label htmlFor="titulo" className="text-xs">Título</Label>
                <Input
                  id="titulo"
                  value={novaTarefa.titulo}
                  onChange={(e) => setNovaTarefa(prev => ({ ...prev, titulo: e.target.value }))}
                  placeholder="O que precisa fazer?"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="descricao" className="text-xs">Descrição (opcional)</Label>
                <Input
                  id="descricao"
                  value={novaTarefa.descricao}
                  onChange={(e) => setNovaTarefa(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Detalhes da tarefa"
                  className="h-8 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="data" className="text-xs">Data</Label>
                  <Input
                    id="data"
                    type="date"
                    value={novaTarefa.data_vencimento}
                    onChange={(e) => setNovaTarefa(prev => ({ ...prev, data_vencimento: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="prioridade" className="text-xs">Prioridade</Label>
                  <Select
                    value={novaTarefa.prioridade}
                    onValueChange={(v) => setNovaTarefa(prev => ({ ...prev, prioridade: v as any }))}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleCriarTarefa}
                disabled={!novaTarefa.titulo.trim() || criarTarefa.isPending}
                className="w-full h-8 text-sm"
              >
                {criarTarefa.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                )}
                Criar Tarefa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Seções de Atividades */}
      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Cards lado a lado - 3 colunas */}
          <div className="grid grid-cols-3 gap-2">
            {renderSecaoAtividades(
              'Atividades Atrasadas',
              'Pendentes',
              tarefasAtrasadas,
              eventosAtrasados
            )}

            {renderSecaoAtividades(
              'Atividades do Dia',
              format(hoje, "dd 'de' MMMM", { locale: ptBR }),
              tarefasHoje,
              eventosHoje
            )}

            {renderSecaoAtividades(
              'Atividades da Semana',
              `${format(inicioSemana, "dd/MM")} - ${format(fimSemana, "dd/MM")}`,
              tarefasSemana,
              eventosSemana
            )}
          </div>

          {renderSecaoAtividades(
            'Atividades da Próxima Semana',
            `${format(inicioProximaSemana, "dd/MM")} - ${format(fimProximaSemana, "dd/MM")}`,
            tarefasProximaSemana,
            eventosProximaSemana
          )}
        </>
      )}

      {/* Modal de Camiseta Entregue */}
      <CamisetaEntregueModal
        open={camisetaModalOpen}
        onOpenChange={setCamisetaModalOpen}
        alunoId={alunoSelecionado?.id || ''}
        alunoNome={alunoSelecionado?.nome || ''}
        onSave={handleSalvarCamiseta}
      />

      {/* Modal de Coleta AH */}
      <RecolherApostilaUnicaModal
        open={coletaAHModalOpen}
        onOpenChange={setColetaAHModalOpen}
        pessoaId={pessoaSelecionadaAH?.id || ''}
        pessoaNome={pessoaSelecionadaAH?.nome || ''}
        pessoaOrigem={pessoaSelecionadaAH?.origem || 'aluno'}
        onSuccess={() => {
          setColetaAHModalOpen(false);
          setPessoaSelecionadaAH(null);
        }}
      />

      {/* Modal de Entrega AH (apostila pronta) */}
      <EntregaAhModal
        open={entregaAHModalOpen}
        onOpenChange={setEntregaAHModalOpen}
        apostilaRecolhidaId={apostilaSelecionadaEntrega?.id || ''}
        apostilaNome={apostilaSelecionadaEntrega?.apostilaNome || ''}
        pessoaNome={apostilaSelecionadaEntrega?.pessoaNome || ''}
      />

      {/* Drawer de Atividades de Evasão */}
      <AtividadesDrawer
        open={drawerEvasaoAberto}
        onClose={() => {
          setDrawerEvasaoAberto(false);
          setAlertaSelecionado(null);
        }}
        alerta={alertaSelecionado}
        onActivityCompleted={refetchAtividadesEvasao}
      />

      {/* Modal de Concluir Aniversário */}
      <ConcluirAniversarioModal
        open={aniversarioModalOpen}
        onOpenChange={setAniversarioModalOpen}
        aluno={aniversariantesSelecionado}
        onSuccess={() => {
          refetchAniversariantes();
          setAniversariantesSelecionado(null);
        }}
      />

      {/* Modal de Entrega de Botom */}
      <EntregaBotomModal
        open={botomModalOpen}
        onOpenChange={setBotomModalOpen}
        pendenciaId={botomSelecionado?.pendenciaId || ''}
        alunoNome={botomSelecionado?.alunoNome || ''}
        apostilaNova={botomSelecionado?.apostilaNova || ''}
        onSuccess={() => {
          refetchBotom();
          setBotomSelecionado(null);
        }}
      />
    </div>
  );
}

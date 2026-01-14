import { useState } from 'react';
import { format, startOfWeek, endOfWeek, addWeeks, isToday, isSameWeek, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Calendar, ClipboardList, Users, RefreshCw, Trash2, Loader2, Shirt, BookOpen, AlertTriangle, Cake } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CamisetaEntregueModal } from '@/components/camisetas/CamisetaEntregueModal';
import { RecolherApostilaUnicaModal } from '@/components/abrindo-horizontes/RecolherApostilaUnicaModal';
import { EntregaAhModal } from '@/components/abrindo-horizontes/EntregaAhModal';

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
}

export default function Home() {
  const { profile } = useAuth();
  const { activeUnit } = useActiveUnit();
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
    coletasAHPendentes,
    isDiaHoje,
    isDiaSemana,
  } = useProfessorAtividades();

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
  
  // Buscar aniversariantes
  const { data: aniversariantes } = useAniversariantes(activeUnit?.id);
  
  // Permissões do usuário
  const { isAdmin, isManagement } = useUserPermissions();
  
  // Filtrar coletas com mais de 90 dias para admins
  const coletasAHAdmins = todasColetasAH.filter(c => 
    c.dias_desde_ultima_correcao !== null && c.dias_desde_ultima_correcao >= 90
  );
  
  // Filtrar camisetas pendentes (>60 dias e não entregues) para admins
  const camisetasAdmins = todosCamisetas.filter(c => 
    !c.camiseta_entregue && !c.nao_tem_tamanho && (c.dias_supera || 0) >= 60
  );
  
  // Filtrar apostilas prontas (não entregues) para admins
  const apostilasProntasAdmins = todasApostilasRecolhidas.filter(a => !a.foi_entregue);

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

  // Montar eventos baseado no perfil (admin, professor ou outros)
  const montarEventos = () => {
    // Para admins/gestores: mostrar todas as atividades
    if (isAdmin || isManagement) {
      const eventosAtrasados: Evento[] = [];
      const eventosHoje: Evento[] = [];
      const eventosSemana: Evento[] = [];
      const eventosProximaSemana: Evento[] = [];

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
      
      // Apostilas AH prontas (não entregues)
      apostilasProntasAdmins.forEach(a => {
        eventosAtrasados.push({
          tipo: 'apostila_ah',
          titulo: `AH Pronta: ${a.pessoa_nome}`,
          data: '',
          subtitulo: `${a.apostila} - ${a.professor_nome || 'Sem professor'}`,
          apostila_recolhida_id: a.id,
          apostila_nome: a.apostila,
          pessoa_nome: a.pessoa_nome,
        });
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
        });
      });

      // Aniversariantes da semana
      aniversariantes?.aniversariantesSemana?.forEach(a => {
        eventosSemana.push({
          tipo: 'aniversario',
          titulo: a.nome,
          data: '',
          subtitulo: `Aniversário: ${a.aniversario_mes_dia}`,
        });
      });

      return { eventosAtrasados, eventosHoje, eventosSemana, eventosProximaSemana };
    }
    
    if (isProfessor) {
      // Para professores: usar apenas atividades das suas turmas
      const eventosAtrasados: Evento[] = [];
      const eventosHoje: Evento[] = [];
      const eventosSemana: Evento[] = [];

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

      // Apostilas AH prontas -> atrasadas
      apostilasAHProntas.forEach(a => {
        eventosAtrasados.push({
          tipo: 'apostila_ah',
          titulo: `AH: ${a.pessoa_nome}`,
          data: '',
          subtitulo: `${a.apostila} - Pronta para entregar`,
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

      // Aniversariantes de hoje (professor)
      aniversariantes?.aniversariantesHoje?.forEach(a => {
        eventosHoje.push({
          tipo: 'aniversario',
          titulo: a.nome,
          data: '',
          subtitulo: 'Aniversário hoje! 🎉',
        });
      });

      // Aniversariantes da semana (professor)
      aniversariantes?.aniversariantesSemana?.forEach(a => {
        eventosSemana.push({
          tipo: 'aniversario',
          titulo: a.nome,
          data: '',
          subtitulo: `Aniversário: ${a.aniversario_mes_dia}`
        });
      });

      return { eventosAtrasados, eventosHoje, eventosSemana, eventosProximaSemana: [] };
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
        })),
      ];

      const eventosSemanaComAniversarios = [
        ...eventosSemana,
        ...(aniversariantes?.aniversariantesSemana || []).map(a => ({
          tipo: 'aniversario' as const,
          titulo: a.nome,
          data: '',
          subtitulo: `Aniversário: ${a.aniversario_mes_dia}`,
        })),
      ];

      return { eventosAtrasados: [], eventosHoje: eventosHojeComAniversarios, eventosSemana: eventosSemanaComAniversarios, eventosProximaSemana };
    }
  };

  const { eventosAtrasados, eventosHoje, eventosSemana, eventosProximaSemana } = montarEventos();

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
      case 'apostila_ah':
        return <BookOpen className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />;
      case 'coleta_ah':
        return <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />;
      case 'aniversario':
        return <Cake className="h-3.5 w-3.5 text-pink-500 flex-shrink-0" />;
      default:
        return <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />;
    }
  };

  const getEventoBadge = (tipo: string) => {
    switch (tipo) {
      case 'aula_experimental':
        return <Badge className="text-[10px] px-1.5 py-0 text-primary-foreground">Aula</Badge>;
      case 'reposicao':
        return <Badge className="text-[10px] px-1.5 py-0 bg-purple-500 text-white">Repos.</Badge>;
      case 'camiseta':
        return <Badge className="text-[10px] px-1.5 py-0 bg-purple-500 text-white">Camiseta</Badge>;
      case 'apostila_ah':
        return <Badge className="text-[10px] px-1.5 py-0 bg-green-500 text-white">AH</Badge>;
      case 'coleta_ah':
        return <Badge className="text-[10px] px-1.5 py-0 bg-red-500 text-white">Coleta</Badge>;
      case 'aniversario':
        return <Badge className="text-[10px] px-1.5 py-0 bg-pink-500 text-white">Aniver.</Badge>;
      default:
        return null;
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
    const isAHProntaClicavel = evento.tipo === 'apostila_ah' && evento.apostila_recolhida_id;
    const isClicavel = isCamisetaClicavel || isColetaAHClicavel || isAHProntaClicavel;
    
    const handleClick = () => {
      if (isCamisetaClicavel) {
        handleCamisetaClick(evento);
      } else if (isColetaAHClicavel) {
        handleColetaAHClick(evento);
      } else if (isAHProntaClicavel) {
        handleAHProntaClick(evento);
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
        {getEventoBadge(evento.tipo)}
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

  const isLoading = loadingTarefas || loadingProfessor || (isAdmin && loadingColetasAH);

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

          {(isAdmin || isManagement || !isProfessor) && renderSecaoAtividades(
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
    </div>
  );
}

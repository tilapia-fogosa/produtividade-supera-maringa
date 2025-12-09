import { useState } from 'react';
import { format, startOfWeek, endOfWeek, addWeeks, isToday, isSameWeek, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveUnit } from '@/contexts/ActiveUnitContext';
import { useTarefasPessoais, TarefaPessoal } from '@/hooks/use-tarefas-pessoais';
import { useListaAulasExperimentais } from '@/hooks/use-lista-aulas-experimentais';
import { useListaReposicoes } from '@/hooks/use-lista-reposicoes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Calendar, ClipboardList, Users, RefreshCw, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

  // Estado para nova tarefa
  const [novaTarefaOpen, setNovaTarefaOpen] = useState(false);
  const [novaTarefa, setNovaTarefa] = useState({
    titulo: '',
    descricao: '',
    data_vencimento: hojeStr,
    prioridade: 'normal' as 'baixa' | 'normal' | 'alta',
  });

  // Filtrar tarefas por período
  const tarefasHoje = tarefas.filter(t => t.data_vencimento === hojeStr);
  const tarefasSemana = tarefas.filter(t => {
    const data = parseISO(t.data_vencimento);
    return isSameWeek(data, hoje, { weekStartsOn: 0 }) && t.data_vencimento !== hojeStr;
  });
  const tarefasProximaSemana = tarefas.filter(t => {
    const data = parseISO(t.data_vencimento);
    return isSameWeek(data, inicioProximaSemana, { weekStartsOn: 0 });
  });

  // Filtrar eventos por período
  const eventosHoje = [
    ...aulasExperimentais.filter(ae => ae.data_aula_experimental === hojeStr).map(ae => ({
      tipo: 'aula_experimental' as const,
      titulo: `Aula Experimental: ${ae.cliente_nome}`,
      data: ae.data_aula_experimental,
    })),
    ...reposicoes.filter(r => r.data_reposicao === hojeStr).map(r => ({
      tipo: 'reposicao' as const,
      titulo: `Reposição: ${r.aluno_nome}`,
      data: r.data_reposicao,
    })),
  ];

  const eventosSemana = [
    ...aulasExperimentais.filter(ae => {
      const data = parseISO(ae.data_aula_experimental);
      return isSameWeek(data, hoje, { weekStartsOn: 0 }) && ae.data_aula_experimental !== hojeStr;
    }).map(ae => ({
      tipo: 'aula_experimental' as const,
      titulo: `Aula Experimental: ${ae.cliente_nome}`,
      data: ae.data_aula_experimental,
    })),
    ...reposicoes.filter(r => {
      const data = parseISO(r.data_reposicao);
      return isSameWeek(data, hoje, { weekStartsOn: 0 }) && r.data_reposicao !== hojeStr;
    }).map(r => ({
      tipo: 'reposicao' as const,
      titulo: `Reposição: ${r.aluno_nome}`,
      data: r.data_reposicao,
    })),
  ];

  const eventosProximaSemana = [
    ...aulasExperimentais.filter(ae => {
      const data = parseISO(ae.data_aula_experimental);
      return isSameWeek(data, inicioProximaSemana, { weekStartsOn: 0 });
    }).map(ae => ({
      tipo: 'aula_experimental' as const,
      titulo: `Aula Experimental: ${ae.cliente_nome}`,
      data: ae.data_aula_experimental,
    })),
    ...reposicoes.filter(r => {
      const data = parseISO(r.data_reposicao);
      return isSameWeek(data, inicioProximaSemana, { weekStartsOn: 0 });
    }).map(r => ({
      tipo: 'reposicao' as const,
      titulo: `Reposição: ${r.aluno_nome}`,
      data: r.data_reposicao,
    })),
  ];

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

  const renderEvento = (evento: { tipo: string; titulo: string; data: string }, index: number) => (
    <div
      key={`${evento.tipo}-${index}`}
      className="flex items-center gap-2 p-2 rounded-md border bg-card"
    >
      {evento.tipo === 'aula_experimental' ? (
        <Users className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
      ) : (
        <RefreshCw className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium">{evento.titulo}</p>
        <p className="text-[10px] text-muted-foreground">
          {format(parseISO(evento.data), "EEE, dd/MM", { locale: ptBR })}
        </p>
      </div>
      <Badge variant={evento.tipo === 'aula_experimental' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
        {evento.tipo === 'aula_experimental' ? 'Aula' : 'Repos.'}
      </Badge>
    </div>
  );

  const renderSecaoAtividades = (
    titulo: string,
    periodo: string,
    tarefas: TarefaPessoal[],
    eventos: { tipo: string; titulo: string; data: string }[]
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

  return (
    <div className="max-w-md mx-auto space-y-3 px-2">
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
      {loadingTarefas ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
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

          {renderSecaoAtividades(
            'Atividades da Próxima Semana',
            `${format(inicioProximaSemana, "dd/MM")} - ${format(fimProximaSemana, "dd/MM")}`,
            tarefasProximaSemana,
            eventosProximaSemana
          )}
        </>
      )}
    </div>
  );
}

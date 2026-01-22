import React, { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, History, FileText, Check, ChevronDown, ChevronUp, Users, User, Calendar, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useAtividadesAlertaEvasao, 
  TIPOS_ATIVIDADE,
  TIPOS_PERMITIDOS_APOS_ACOLHIMENTO,
  type TipoAtividadeEvasao,
  type AtividadeAlertaEvasao
} from '@/hooks/use-atividades-alerta-evasao';
import type { AlertaEvasao } from '@/hooks/use-alertas-evasao-lista';

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

export function AtividadesDrawer({ open, onClose, alerta }: AtividadesDrawerProps) {
  const [atividadeExpandida, setAtividadeExpandida] = useState<string | null>(null);
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoAtividadeEvasao | null>(null);
  const [descricao, setDescricao] = useState('');
  
  // Estado para painel de resultado da negociação
  const [mostrarResultadoNegociacao, setMostrarResultadoNegociacao] = useState(false);
  const [atividadeNegociacao, setAtividadeNegociacao] = useState<AtividadeAlertaEvasao | null>(null);
  const [resultadoSelecionado, setResultadoSelecionado] = useState<ResultadoNegociacao | null>(null);
  const [dataFimAjuste, setDataFimAjuste] = useState('');

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

  const handleExpandirAtividade = (atividade: AtividadeAlertaEvasao) => {
    if (atividade.status === 'concluida') return;
    
    // Se for tarefa administrativa simples, não expande - apenas conclui
    if (TIPOS_TAREFA_ADMIN.includes(atividade.tipo_atividade)) {
      return;
    }
    
    // Se for negociação financeira, expande o painel de resultado
    if (atividade.tipo_atividade === 'atendimento_financeiro') {
      setAtividadeNegociacao(atividade);
      setMostrarResultadoNegociacao(true);
      setResultadoSelecionado(null);
      setDataFimAjuste('');
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

  const handleConcluirTarefaAdmin = async (atividade: AtividadeAlertaEvasao, e: React.MouseEvent) => {
    e.stopPropagation();
    await concluirTarefa(atividade.id);
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
    
    await processarNegociacao({
      resultado: resultadoSelecionado,
      atividadeAnteriorId: atividadeNegociacao.id,
      dataFimAjuste: resultadoSelecionado === 'ajuste_temporario' ? new Date(dataFimAjuste) : undefined
    });
    
    setMostrarResultadoNegociacao(false);
    setAtividadeNegociacao(null);
    setResultadoSelecionado(null);
    setDataFimAjuste('');
  };

  const fecharPainelResultado = () => {
    setMostrarResultadoNegociacao(false);
    setAtividadeNegociacao(null);
    setResultadoSelecionado(null);
    setDataFimAjuste('');
  };

  const resetState = () => {
    setAtividadeExpandida(null);
    setTipoSelecionado(null);
    setDescricao('');
    fecharPainelResultado();
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
  const drawerWidth = mostrarResultadoNegociacao ? 'max-w-2xl' : 'max-w-sm';

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
          <div className={`flex flex-col ${mostrarResultadoNegociacao ? 'w-1/2 border-r' : 'w-full'}`}>
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
                    const isNegociacaoAtiva = mostrarResultadoNegociacao && atividadeNegociacao?.id === atividade.id;
                    
                    return (
                      <Card 
                        key={atividade.id} 
                        className={`overflow-hidden transition-all ${
                          isPendente && !isTarefaAdmin ? 'cursor-pointer hover:shadow-sm' : ''
                        } ${!isPendente ? 'opacity-70' : ''} ${isNegociacaoAtiva ? 'ring-2 ring-primary' : ''}`}
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
                              {isPendente && !isTarefaAdmin && !isNegociacaoFinanceira && (
                                isExpanded 
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
                          
                          {/* Botão para concluir tarefa administrativa */}
                          {isPendente && isTarefaAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full mt-1 h-6 text-[10px]"
                              disabled={isConcluindoTarefa}
                              onClick={(e) => handleConcluirTarefaAdmin(atividade, e)}
                            >
                              {isConcluindoTarefa ? 'Concluindo...' : 'Concluir'}
                            </Button>
                          )}
                          
                          {/* Botão para processar negociação financeira */}
                          {isPendente && isNegociacaoFinanceira && !isNegociacaoAtiva && (
                            <Button
                              size="sm"
                              className="w-full mt-1 h-6 text-[10px]"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExpandirAtividade(atividade);
                              }}
                            >
                              Registrar Resultado
                            </Button>
                          )}
                          
                          {/* Formulário para criar nova atividade (expandido) */}
                          {isExpanded && isPendente && !isTarefaAdmin && !isNegociacaoFinanceira && (
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
                    <Input
                      type="date"
                      value={dataFimAjuste}
                      onChange={(e) => setDataFimAjuste(e.target.value)}
                      className="h-7 text-xs"
                    />
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
        </div>
      </DrawerContent>
    </Drawer>
  );
}

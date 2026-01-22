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
import { X, History, FileText, Check, ChevronDown, ChevronUp, Users, User, Calendar } from 'lucide-react';
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
import { ResultadoNegociacaoModal, type ResultadoNegociacao } from './ResultadoNegociacaoModal';

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
  const [negociacaoModalOpen, setNegociacaoModalOpen] = useState(false);
  const [atividadeNegociacao, setAtividadeNegociacao] = useState<AtividadeAlertaEvasao | null>(null);

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
      return format(new Date(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
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
    
    // Se for negociação financeira, abre o modal especial
    if (atividade.tipo_atividade === 'atendimento_financeiro') {
      setAtividadeNegociacao(atividade);
      setNegociacaoModalOpen(true);
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

  const handleResultadoNegociacao = async (resultado: ResultadoNegociacao, dataFimAjuste?: Date) => {
    if (!atividadeNegociacao) return;
    
    await processarNegociacao({
      resultado,
      atividadeAnteriorId: atividadeNegociacao.id,
      dataFimAjuste
    });
    
    setNegociacaoModalOpen(false);
    setAtividadeNegociacao(null);
  };

  const resetState = () => {
    setAtividadeExpandida(null);
    setTipoSelecionado(null);
    setDescricao('');
    setNegociacaoModalOpen(false);
    setAtividadeNegociacao(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Renderiza info do responsável baseado no tipo
  const renderResponsavelInfo = (atividade: AtividadeAlertaEvasao) => {
    const isPendente = atividade.status === 'pendente';
    
    if (!isPendente && atividade.concluido_por_nome) {
      // Atividade concluída - mostra quem concluiu
      return (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <User className="h-3 w-3" />
          Concluído por: {atividade.concluido_por_nome}
        </p>
      );
    }
    
    if (atividade.departamento_responsavel) {
      // Responsável é um departamento
      return (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Users className="h-3 w-3" />
          Responsável: {atividade.departamento_responsavel === 'administrativo' ? 'Administrativo' : atividade.departamento_responsavel}
        </p>
      );
    }
    
    if (atividade.responsavel_nome) {
      // Responsável é uma pessoa específica (professor ou quem criou)
      return (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <User className="h-3 w-3" />
          Responsável: {atividade.responsavel_nome}
        </p>
      );
    }
    
    return null;
  };

  // Renderiza badge de status terminal
  const renderTerminalBadge = (atividade: AtividadeAlertaEvasao) => {
    if (atividade.tipo_atividade === 'retencao') {
      return (
        <Badge className="bg-green-100 text-green-700 text-xs">
          ✓ Aluno retido com sucesso
        </Badge>
      );
    }
    if (atividade.tipo_atividade === 'evasao') {
      return (
        <Badge className="bg-red-100 text-red-700 text-xs">
          ✗ Aluno evadido
        </Badge>
      );
    }
    return null;
  };

  // Renderiza data agendada se houver
  const renderDataAgendada = (atividade: AtividadeAlertaEvasao) => {
    if (!atividade.data_agendada) return null;
    
    return (
      <p className="text-xs text-amber-600 flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        Agendada para: {formatarDataAgendada(atividade.data_agendada)}
      </p>
    );
  };

  if (!alerta) return null;

  return (
    <>
      <Drawer open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DrawerContent direction="right" className="h-full w-full max-w-md">
          <DrawerHeader className="border-b py-3">
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle className="text-lg">Histórico de Atividades</DrawerTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {alerta.aluno?.nome || 'Aluno não identificado'}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DrawerHeader>

          <div className="flex flex-col h-[calc(100%-4rem)]">
            <div className="p-3 border-b flex items-center gap-2 bg-muted/30">
              <History className="h-4 w-4" />
              <span className="font-medium text-sm">Atividades</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                {atividades.length}
              </Badge>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-3 space-y-3">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Carregando...
                  </div>
                ) : atividades.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma atividade registrada</p>
                  </div>
                ) : (
                  atividades.map((atividade) => {
                    const tipoConfig = getTipoConfig(atividade.tipo_atividade);
                    const isPendente = atividade.status === 'pendente';
                    const isExpanded = atividadeExpandida === atividade.id;
                    const isTerminal = ['retencao', 'evasao'].includes(atividade.tipo_atividade);
                    const isTarefaAdmin = TIPOS_TAREFA_ADMIN.includes(atividade.tipo_atividade);
                    const isNegociacaoFinanceira = atividade.tipo_atividade === 'atendimento_financeiro';
                    
                    return (
                      <Card 
                        key={atividade.id} 
                        className={`overflow-hidden transition-all ${
                          isPendente && !isTarefaAdmin ? 'cursor-pointer hover:shadow-md' : ''
                        } ${!isPendente ? 'opacity-75' : ''}`}
                        onClick={() => handleExpandirAtividade(atividade)}
                      >
                        <div className={`h-1.5 ${tipoConfig.color}`} />
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={`${tipoConfig.color} text-white text-xs`}>
                                {tipoConfig.label}
                              </Badge>
                              {!isPendente && !isTerminal && (
                                <div className="flex items-center gap-1 text-green-600">
                                  <Check className="h-3 w-3" />
                                  <span className="text-xs">Concluída</span>
                                </div>
                              )}
                              {isTerminal && renderTerminalBadge(atividade)}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatarData(atividade.created_at)}
                              </span>
                              {isPendente && !isTarefaAdmin && !isNegociacaoFinanceira && (
                                isExpanded 
                                  ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                  : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          <p className="text-sm">{atividade.descricao}</p>
                          {renderResponsavelInfo(atividade)}
                          {renderDataAgendada(atividade)}
                          
                          {/* Botão para concluir tarefa administrativa */}
                          {isPendente && isTarefaAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full mt-2"
                              disabled={isConcluindoTarefa}
                              onClick={(e) => handleConcluirTarefaAdmin(atividade, e)}
                            >
                              {isConcluindoTarefa ? 'Concluindo...' : 'Marcar como Concluída'}
                            </Button>
                          )}
                          
                          {/* Botão para processar negociação financeira */}
                          {isPendente && isNegociacaoFinanceira && (
                            <Button
                              size="sm"
                              className="w-full mt-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAtividadeNegociacao(atividade);
                                setNegociacaoModalOpen(true);
                              }}
                            >
                              Registrar Resultado
                            </Button>
                          )}
                          
                          {/* Formulário para criar nova atividade (expandido) */}
                          {isExpanded && isPendente && !isTarefaAdmin && !isNegociacaoFinanceira && (
                            <div 
                              className="mt-4 pt-4 border-t space-y-3"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <p className="text-sm font-medium">Criar nova atividade:</p>
                              
                              <div className="flex flex-wrap gap-2">
                                {TIPOS_PERMITIDOS_APOS_ACOLHIMENTO.map((tipo) => {
                                  const config = getTipoConfig(tipo);
                                  const isSelected = tipoSelecionado === tipo;
                                  return (
                                    <Badge
                                      key={tipo}
                                      className={`cursor-pointer transition-all ${
                                        isSelected 
                                          ? `${config.color} text-white ring-2 ring-offset-2` 
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
                                placeholder="Descreva o que foi feito..."
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                rows={3}
                              />
                              
                              <Button
                                size="sm"
                                disabled={!tipoSelecionado || !descricao.trim() || isCriando}
                                onClick={() => handleCriarAtividade(atividade.id)}
                                className="w-full"
                              >
                                {isCriando ? 'Salvando...' : 'Registrar Atividade'}
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
        </DrawerContent>
      </Drawer>

      <ResultadoNegociacaoModal
        open={negociacaoModalOpen}
        onClose={() => {
          setNegociacaoModalOpen(false);
          setAtividadeNegociacao(null);
        }}
        onConfirm={handleResultadoNegociacao}
        isLoading={isProcessandoNegociacao}
        alunoNome={alerta?.aluno?.nome}
      />
    </>
  );
}

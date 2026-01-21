import React, { useState } from 'react';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle 
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { X, Plus, History, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useAtividadesAlertaEvasao, 
  TIPOS_ATIVIDADE, 
  type TipoAtividadeEvasao 
} from '@/hooks/use-atividades-alerta-evasao';
import type { AlertaEvasao } from '@/hooks/use-alertas-evasao-lista';

interface AtividadesDrawerProps {
  open: boolean;
  onClose: () => void;
  alerta: AlertaEvasao | null;
}

export function AtividadesDrawer({ open, onClose, alerta }: AtividadesDrawerProps) {
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoAtividadeEvasao | null>(null);
  const [descricao, setDescricao] = useState('');
  
  const { 
    atividades, 
    isLoading, 
    criarAtividade, 
    isCriando 
  } = useAtividadesAlertaEvasao(alerta?.id || null);

  const handleCriarAtividade = async () => {
    if (!tipoSelecionado || !descricao.trim()) return;
    
    try {
      await criarAtividade({
        tipo_atividade: tipoSelecionado,
        descricao: descricao.trim()
      });
      setTipoSelecionado(null);
      setDescricao('');
    } catch (error) {
      console.error('Erro ao criar atividade:', error);
    }
  };

  const handleClose = () => {
    setTipoSelecionado(null);
    setDescricao('');
    onClose();
  };

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

  if (!alerta) return null;

  return (
    <Drawer open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DrawerContent direction="right" className="h-full w-[90%] max-w-2xl">
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="text-lg">Atividades do Alerta</DrawerTitle>
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
          {/* Seção de Nova Atividade */}
          <div className="p-4 border-b space-y-4">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span className="font-medium">Nova Atividade</span>
            </div>
            
            {/* Botões de tipo de atividade */}
            <div className="flex flex-wrap gap-2">
              {TIPOS_ATIVIDADE.map((tipo) => (
                <Button
                  key={tipo.value}
                  variant={tipoSelecionado === tipo.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTipoSelecionado(tipo.value)}
                  className={tipoSelecionado === tipo.value ? `${tipo.color} text-white border-0` : ''}
                >
                  {tipo.label}
                </Button>
              ))}
            </div>

            {/* Campo de descrição (aparece quando um tipo é selecionado) */}
            {tipoSelecionado && (
              <div className="space-y-3">
                <Textarea
                  placeholder="Descreva a atividade realizada..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCriarAtividade}
                    disabled={!descricao.trim() || isCriando}
                    size="sm"
                  >
                    {isCriando ? 'Salvando...' : 'Registrar Atividade'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setTipoSelecionado(null);
                      setDescricao('');
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Histórico de Atividades */}
          <div className="flex-1 overflow-hidden">
            <div className="p-4 border-b flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="font-medium">Histórico de Atividades</span>
              <Badge variant="secondary" className="ml-auto">
                {atividades.length}
              </Badge>
            </div>

            <ScrollArea className="h-[calc(100%-3rem)]">
              <div className="p-4 space-y-3">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Carregando atividades...
                  </div>
                ) : atividades.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma atividade registrada</p>
                    <p className="text-sm">Selecione um tipo de atividade acima para começar</p>
                  </div>
                ) : (
                  atividades.map((atividade) => {
                    const tipoConfig = getTipoConfig(atividade.tipo_atividade);
                    return (
                      <Card key={atividade.id} className="overflow-hidden">
                        <div className={`h-1 ${tipoConfig.color}`} />
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge className={`${tipoConfig.color} text-white`}>
                              {tipoConfig.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatarData(atividade.created_at)}
                            </span>
                          </div>
                          <p className="text-sm">{atividade.descricao}</p>
                          {atividade.responsavel_nome && (
                            <p className="text-xs text-muted-foreground">
                              Por: {atividade.responsavel_nome}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

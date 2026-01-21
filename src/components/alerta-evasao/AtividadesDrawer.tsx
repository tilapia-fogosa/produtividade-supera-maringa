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
import { X, History, FileText, Send } from 'lucide-react';
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
      <DrawerContent direction="right" className="h-full w-[95%] max-w-4xl">
        <DrawerHeader className="border-b py-3">
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

        {/* Layout de 3 colunas */}
        <div className="flex h-[calc(100%-4rem)] divide-x">
          
          {/* Coluna Esquerda - Histórico */}
          <div className="w-1/3 flex flex-col">
            <div className="p-3 border-b flex items-center gap-2 bg-muted/30">
              <History className="h-4 w-4" />
              <span className="font-medium text-sm">Histórico</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                {atividades.length}
              </Badge>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Carregando...
                  </div>
                ) : atividades.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma atividade</p>
                  </div>
                ) : (
                  atividades.map((atividade) => {
                    const tipoConfig = getTipoConfig(atividade.tipo_atividade);
                    return (
                      <Card key={atividade.id} className="overflow-hidden">
                        <div className={`h-1 ${tipoConfig.color}`} />
                        <CardContent className="p-2 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <Badge className={`${tipoConfig.color} text-white text-xs`}>
                              {tipoConfig.label}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {formatarData(atividade.created_at)}
                            </span>
                          </div>
                          <p className="text-xs line-clamp-3">{atividade.descricao}</p>
                          {atividade.responsavel_nome && (
                            <p className="text-[10px] text-muted-foreground">
                              {atividade.responsavel_nome}
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

          {/* Coluna do Meio - Tipos de Atividade */}
          <div className="w-1/3 flex flex-col">
            <div className="p-3 border-b bg-muted/30">
              <span className="font-medium text-sm">Tipo de Atividade</span>
            </div>

            <div className="p-3 space-y-2">
              {TIPOS_ATIVIDADE.map((tipo) => (
                <Button
                  key={tipo.value}
                  variant={tipoSelecionado === tipo.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTipoSelecionado(tipo.value)}
                  className={`w-full justify-start ${tipoSelecionado === tipo.value ? `${tipo.color} text-white border-0` : ''}`}
                >
                  <div className={`w-2 h-2 rounded-full mr-2 ${tipo.color}`} />
                  {tipo.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Coluna Direita - Input da Atividade */}
          <div className="w-1/3 flex flex-col">
            <div className="p-3 border-b bg-muted/30">
              <span className="font-medium text-sm">Registrar Atividade</span>
            </div>

            <div className="p-3 flex flex-col flex-1">
              {!tipoSelecionado ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <p className="text-sm text-center">
                    Selecione um tipo de atividade ao lado
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <Badge className={`${getTipoConfig(tipoSelecionado).color} text-white`}>
                      {getTipoConfig(tipoSelecionado).label}
                    </Badge>
                  </div>
                  
                  <Textarea
                    placeholder="Descreva a atividade realizada..."
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    className="flex-1 min-h-[150px] resize-none"
                  />
                  
                  <div className="flex gap-2 mt-3">
                    <Button 
                      onClick={handleCriarAtividade}
                      disabled={!descricao.trim() || isCriando}
                      className="flex-1"
                      size="sm"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isCriando ? 'Salvando...' : 'Registrar'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setTipoSelecionado(null);
                        setDescricao('');
                      }}
                    >
                      Limpar
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

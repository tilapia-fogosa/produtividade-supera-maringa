import React from 'react';
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
import { X, History, FileText } from 'lucide-react';
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
  const { 
    atividades, 
    isLoading 
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

  if (!alerta) return null;

  return (
    <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DrawerContent direction="right" className="h-full w-full max-w-md">
        <DrawerHeader className="border-b py-3">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="text-lg">Histórico de Atividades</DrawerTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {alerta.aluno?.nome || 'Aluno não identificado'}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
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
                  return (
                    <Card key={atividade.id} className="overflow-hidden">
                      <div className={`h-1.5 ${tipoConfig.color}`} />
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <Badge className={`${tipoConfig.color} text-white text-xs`}>
                            {tipoConfig.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatarData(atividade.created_at)}
                          </span>
                        </div>
                        <p className="text-sm">{atividade.descricao}</p>
                        {atividade.responsavel_nome && (
                          <p className="text-xs text-muted-foreground">
                            Responsável: {atividade.responsavel_nome}
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
      </DrawerContent>
    </Drawer>
  );
}

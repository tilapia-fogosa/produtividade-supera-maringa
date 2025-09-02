import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoricoTimelineProps {
  historicoCompleto: any;
  loading: boolean;
}

export function HistoricoTimeline({ historicoCompleto, loading }: HistoricoTimelineProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-muted-foreground">Carregando histórico...</div>
      </div>
    );
  }

  if (!historicoCompleto) {
    return (
      <div className="text-center text-muted-foreground">
        Nenhum histórico disponível.
      </div>
    );
  }

  // Combinar todos os eventos em uma timeline única
  const eventos = [
    ...(historicoCompleto.alertas || []).map((alerta: any) => ({
      ...alerta,
      tipo: 'alerta',
      data: alerta.data_alerta,
      icone: AlertTriangle,
      cor: 'text-destructive'
    })),
    ...(historicoCompleto.retencoes || []).map((retencao: any) => ({
      ...retencao,
      tipo: 'retencao',
      data: retencao.data_retencao,
      icone: Shield,
      cor: 'text-primary'
    }))
  ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  if (eventos.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Nenhum evento encontrado no histórico.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Timeline de Eventos</h3>
      
      <div className="relative">
        {/* Linha vertical da timeline */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
        
        <div className="space-y-6">
          {eventos.map((evento, index) => {
            const Icone = evento.icone;
            
            return (
              <div key={`${evento.tipo}-${evento.id}-${index}`} className="relative flex items-start space-x-6">
                {/* Ícone da timeline */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-background border-2 border-current ${evento.cor} flex items-center justify-center relative z-10`}>
                  <Icone className="h-4 w-4" />
                </div>
                
                {/* Conteúdo do evento */}
                <div className="flex-1 min-w-0">
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {evento.tipo === 'alerta' ? 'Alerta de Evasão' : 'Retenção'}
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge variant={evento.tipo === 'alerta' ? 'destructive' : 'default'}>
                            {evento.tipo === 'alerta' ? evento.origem_alerta?.replace('_', ' ').toUpperCase() : 'RETENÇÃO'}
                          </Badge>
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {format(new Date(evento.data), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      {/* Responsável */}
                      {evento.responsavel && (
                        <div className="flex items-center space-x-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Responsável:</span>
                          <span>{evento.responsavel}</span>
                        </div>
                      )}
                      
                      {/* Descrição/Ações */}
                      {evento.descritivo && (
                        <div>
                          <span className="text-sm font-medium">Descrição:</span>
                          <p className="text-sm text-muted-foreground mt-1">
                            {evento.descritivo}
                          </p>
                        </div>
                      )}
                      
                      {evento.acoes_tomadas && (
                        <div>
                          <span className="text-sm font-medium">Ações tomadas:</span>
                          <p className="text-sm text-muted-foreground mt-1">
                            {evento.acoes_tomadas}
                          </p>
                        </div>
                      )}
                      
                      {/* Status para alertas */}
                      {evento.tipo === 'alerta' && evento.status && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">Status:</span>
                          <Badge variant="outline">
                            {evento.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
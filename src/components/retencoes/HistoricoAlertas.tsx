import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, User, FileText, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoricoAlertasProps {
  alertas: any[];
  loading: boolean;
}

export function HistoricoAlertas({ alertas, loading }: HistoricoAlertasProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-muted-foreground">Carregando alertas...</div>
      </div>
    );
  }

  if (!alertas || alertas.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum alerta de evasão registrado para este aluno.</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pendente':
        return <Badge variant="destructive">Pendente</Badge>;
      case 'resolvido':
        return <Badge className="bg-green-500 text-white">Resolvido</Badge>;
      case 'em_andamento':
        return <Badge variant="default">Em Andamento</Badge>;
      default:
        return <Badge variant="outline">{status || 'Indefinido'}</Badge>;
    }
  };

  const getOrigemBadge = (origem: string) => {
    const origens: { [key: string]: { label: string; color: string } } = {
      'conversa_indireta': { label: 'Conversa Indireta', color: 'bg-blue-500' },
      'aviso_recepcao': { label: 'Aviso Recepção', color: 'bg-purple-500' },
      'aviso_professor_coordenador': { label: 'Prof./Coordenador', color: 'bg-orange-500' },
      'aviso_whatsapp': { label: 'WhatsApp', color: 'bg-green-500' },
      'inadimplencia': { label: 'Inadimplência', color: 'bg-red-500' },
      'outro': { label: 'Outro', color: 'bg-gray-500' }
    };

    const config = origens[origem] || { label: origem, color: 'bg-gray-500' };
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Histórico de Alertas</h3>
        <Badge variant="outline">
          {alertas.length} alerta{alertas.length === 1 ? '' : 's'}
        </Badge>
      </div>

      <div className="space-y-4">
        {alertas.map((alerta, index) => (
          <Card key={alerta.id || index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <span>Alerta #{index + 1}</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(alerta.status)}
                  {getOrigemBadge(alerta.origem_alerta)}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Data e Responsável */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Data do alerta:</span>
                  <span>
                    {format(new Date(alerta.data_alerta), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </span>
                </div>

                {alerta.responsavel && (
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Responsável:</span>
                    <span>{alerta.responsavel}</span>
                  </div>
                )}
              </div>

              {/* Data de Retenção */}
              {alerta.data_retencao && (
                <div className="flex items-center space-x-2 text-sm">
                  <Activity className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Data da retenção:</span>
                  <span className="text-green-600 font-medium">
                    {format(new Date(alerta.data_retencao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </span>
                </div>
              )}

              {/* Descrição */}
              {alerta.descritivo && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Descrição:</span>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-md">
                    <p className="text-sm whitespace-pre-line">
                      {alerta.descritivo}
                    </p>
                  </div>
                </div>
              )}

              {/* Status do Kanban */}
              {alerta.kanban_status && (
                <div className="flex items-center space-x-2 text-sm">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Status no kanban:</span>
                  <Badge variant="outline">
                    {alerta.kanban_status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              )}

              {/* Informações de criação */}
              <div className="pt-2 border-t text-xs text-muted-foreground">
                Criado em {format(new Date(alerta.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                {alerta.updated_at && alerta.updated_at !== alerta.created_at && (
                  <span> • Atualizado em {format(new Date(alerta.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
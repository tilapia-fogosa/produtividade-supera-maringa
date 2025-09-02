import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Calendar, User, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoricoRetencoesProps {
  retencoes: any[];
  loading: boolean;
}

export function HistoricoRetencoes({ retencoes, loading }: HistoricoRetencoesProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-muted-foreground">Carregando retenções...</div>
      </div>
    );
  }

  if (!retencoes || retencoes.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhuma retenção registrada para este aluno.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Histórico de Retenções</h3>
        <Badge variant="outline">
          {retencoes.length} retenç{retencoes.length === 1 ? 'ão' : 'ões'}
        </Badge>
      </div>

      <div className="space-y-4">
        {retencoes.map((retencao, index) => (
          <Card key={retencao.id || index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span>Retenção #{index + 1}</span>
                </CardTitle>
                <Badge className="bg-primary text-primary-foreground">
                  Concluída
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Data e Responsável */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Data:</span>
                  <span>
                    {format(new Date(retencao.data_retencao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </span>
                </div>

                {retencao.responsavel && (
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Responsável:</span>
                    <span>{retencao.responsavel}</span>
                  </div>
                )}
              </div>

              {/* Descrição */}
              {retencao.descritivo && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Descrição da situação:</span>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-md">
                    <p className="text-sm whitespace-pre-line">
                      {retencao.descritivo}
                    </p>
                  </div>
                </div>
              )}

              {/* Ações Tomadas */}
              {retencao.acoes_tomadas && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Ações tomadas:</span>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-md border border-primary/20">
                    <p className="text-sm whitespace-pre-line">
                      {retencao.acoes_tomadas}
                    </p>
                  </div>
                </div>
              )}

              {/* Informações de criação */}
              <div className="pt-2 border-t text-xs text-muted-foreground">
                Criado em {format(new Date(retencao.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                {retencao.created_by && ` por ${retencao.created_by}`}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
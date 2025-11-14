import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertTriangle, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SyncLog {
  id: string;
  fileName: string;
  status: 'success' | 'error' | 'processing';
  timestamp: string;
  details: {
    turmas_criadas?: number;
    professores_criados?: number;
    alunos_criados?: number;
    error_message?: string;
  };
}

const XlsSyncStatus = () => {
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);

  // Simular dados de sincronização (em produção, viria do backend)
  useEffect(() => {
    const mockLogs: SyncLog[] = [
      {
        id: '1',
        fileName: 'turmas-janeiro-2024.xlsx',
        status: 'success',
        timestamp: new Date().toISOString(),
        details: {
          turmas_criadas: 15,
          professores_criados: 8,
          alunos_criados: 120
        }
      },
      {
        id: '2',
        fileName: 'dados-completos.xlsx',
        status: 'error',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        details: {
          error_message: 'Formato de data inválido na linha 15'
        }
      }
    ];
    setSyncLogs(mockLogs);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Sucesso</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">Processando</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  return (
    <Card className="border-orange-200 bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-azul-500">Histórico de Sincronizações</CardTitle>
      </CardHeader>
      <CardContent>
        {syncLogs.length === 0 ? (
          <div className="text-center text-azul-400 py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma sincronização realizada ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {syncLogs.map((log) => (
              <div key={log.id} className="border border-orange-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(log.status)}
                    <span className="font-medium text-azul-500 text-sm">{log.fileName}</span>
                  </div>
                  {getStatusBadge(log.status)}
                </div>
                
                <div className="text-xs text-azul-400 mb-2">
                  {format(new Date(log.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
                
                {log.status === 'success' && log.details && (
                  <div className="text-xs text-green-700 bg-green-50 p-2 rounded">
                    <p>✓ {log.details.turmas_criadas} turmas processadas</p>
                    <p>✓ {log.details.professores_criados} professores processados</p>
                    <p>✓ {log.details.alunos_criados} alunos processados</p>
                  </div>
                )}
                
                {log.status === 'error' && log.details?.error_message && (
                  <div className="text-xs text-red-700 bg-red-50 p-2 rounded">
                    <p>✗ {log.details.error_message}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default XlsSyncStatus;
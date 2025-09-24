import React from 'react';
import { FileSpreadsheet, Clock } from "lucide-react";
import XlsUploadComponent from '@/components/sync/XlsUploadComponent';
import { useUltimaSincronizacao } from '@/hooks/use-ultima-sincronizacao';
import { formatDateBr } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SincronizarTurmas = () => {
  const { data: sincronizacoes, isLoading } = useUltimaSincronizacao();

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-3 mb-6">
        <FileSpreadsheet className="h-8 w-8 text-supera" />
        <div>
          <h1 className="text-2xl font-bold text-azul-500">Sincronizar Turmas</h1>
          <p className="text-azul-400">Importe turmas, professores e alunos via arquivo Excel</p>
        </div>
      </div>
      
      <div className="space-y-6">
        <XlsUploadComponent />
        
        {/* Card com histórico das últimas sincronizações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Histórico de Sincronizações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : sincronizacoes && sincronizacoes.length > 0 ? (
              <div className="space-y-3">
                {sincronizacoes.map((sync, index) => (
                  <div key={sync.id} className="border-b border-border pb-3 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {formatDateBr(new Date(sync.created_at))} às {new Date(sync.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {sync.file_name && (
                          <p className="text-xs text-muted-foreground">
                            Arquivo: {sync.file_name}
                          </p>
                        )}
                        {sync.processed_rows > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {sync.processed_rows} registros processados
                          </p>
                        )}
                      </div>
                      {index === 0 && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Mais recente
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhuma sincronização realizada ainda</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SincronizarTurmas;
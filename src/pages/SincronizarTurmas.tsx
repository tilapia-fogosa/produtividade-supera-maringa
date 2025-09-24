import React from 'react';
import { FileSpreadsheet, Clock } from "lucide-react";
import XlsUploadComponent from '@/components/sync/XlsUploadComponent';
import { useUltimaSincronizacao } from '@/hooks/use-ultima-sincronizacao';
import { formatDateBr } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SincronizarTurmas = () => {
  const { data: ultimaSincronizacao, isLoading } = useUltimaSincronizacao();

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
        {/* Card com informações da última sincronização */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Última Sincronização
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : ultimaSincronizacao ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Data:</strong> {formatDateBr(new Date(ultimaSincronizacao.created_at))} às {new Date(ultimaSincronizacao.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
                {ultimaSincronizacao.file_name && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Arquivo:</strong> {ultimaSincronizacao.file_name}
                  </p>
                )}
                {ultimaSincronizacao.processed_rows > 0 && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Registros processados:</strong> {ultimaSincronizacao.processed_rows}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhuma sincronização realizada ainda</p>
            )}
          </CardContent>
        </Card>

        <XlsUploadComponent />
      </div>
    </div>
  );
};

export default SincronizarTurmas;
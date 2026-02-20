
import React from 'react';
import { Textarea } from "@/components/ui/textarea";

interface HistoricoAlertasViewProps {
  alertasAnteriores: any[];
  historicoAlertas: string | null;
  carregandoHistorico: boolean;
}

export function HistoricoAlertasView({ 
  alertasAnteriores, 
  historicoAlertas, 
  carregandoHistorico 
}: HistoricoAlertasViewProps) {
  if (alertasAnteriores.length === 0) {
    return null;
  }

  return (
    <div className="border rounded-md p-3 bg-orange-50">
      <p className="text-sm font-medium mb-2">
        Histórico de alertas anteriores ({alertasAnteriores.length})
      </p>
      {carregandoHistorico ? (
        <p className="text-xs text-gray-500">Carregando histórico...</p>
      ) : (
        <Textarea
          className="h-24 text-xs"
          readOnly
          value={historicoAlertas || ''}
        />
      )}
    </div>
  );
}

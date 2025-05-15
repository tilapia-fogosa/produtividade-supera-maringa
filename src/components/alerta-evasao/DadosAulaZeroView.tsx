
import React from 'react';

interface DadosAulaZeroViewProps {
  dadosAulaZero: any | null;
}

export function DadosAulaZeroView({ dadosAulaZero }: DadosAulaZeroViewProps) {
  if (!dadosAulaZero) {
    return null;
  }

  return (
    <div className="border rounded-md p-3 bg-blue-50">
      <p className="text-sm font-medium mb-2">
        Dados da Aula Zero
      </p>
      <div className="text-xs space-y-1">
        {dadosAulaZero.motivo_procura && (
          <p><span className="font-medium">Motivo da procura:</span> {dadosAulaZero.motivo_procura}</p>
        )}
        {dadosAulaZero.percepcao_coordenador && (
          <p><span className="font-medium">Percepção do coordenador:</span> {dadosAulaZero.percepcao_coordenador}</p>
        )}
        {dadosAulaZero.avaliacao_abaco && (
          <p><span className="font-medium">Avaliação no Ábaco:</span> {dadosAulaZero.avaliacao_abaco}</p>
        )}
        {dadosAulaZero.avaliacao_ah && (
          <p><span className="font-medium">Avaliação no AH:</span> {dadosAulaZero.avaliacao_ah}</p>
        )}
        {dadosAulaZero.pontos_atencao && (
          <p><span className="font-medium">Pontos de atenção:</span> {dadosAulaZero.pontos_atencao}</p>
        )}
      </div>
    </div>
  );
}

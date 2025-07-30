import React from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import { DadosAulaZero } from '@/types/alertas';

interface AulaZeroSidePanelViewProps {
  dadosAulaZero: DadosAulaZero | null;
  onClose: () => void;
}

export function AulaZeroSidePanelView({ dadosAulaZero, onClose }: AulaZeroSidePanelViewProps) {
  if (!dadosAulaZero) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
        <p>Nenhum dado da Aula Zero disponível</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-card border-l">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">Dados da Aula Zero</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {dadosAulaZero.motivo_procura && (
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Motivo da Procura</h4>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                {dadosAulaZero.motivo_procura}
              </p>
            </div>
          )}

          {dadosAulaZero.percepcao_coordenador && (
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Percepção do Coordenador</h4>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                {dadosAulaZero.percepcao_coordenador}
              </p>
            </div>
          )}

          {dadosAulaZero.avaliacao_abaco && (
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Avaliação no Ábaco</h4>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                {dadosAulaZero.avaliacao_abaco}
              </p>
            </div>
          )}

          {dadosAulaZero.avaliacao_ah && (
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Avaliação no AH</h4>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                {dadosAulaZero.avaliacao_ah}
              </p>
            </div>
          )}

          {dadosAulaZero.pontos_atencao && (
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Pontos de Atenção</h4>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                {dadosAulaZero.pontos_atencao}
              </p>
            </div>
          )}

          {/* Caso não tenha nenhum dado */}
          {!dadosAulaZero.motivo_procura && 
           !dadosAulaZero.percepcao_coordenador && 
           !dadosAulaZero.avaliacao_abaco && 
           !dadosAulaZero.avaliacao_ah && 
           !dadosAulaZero.pontos_atencao && (
            <div className="text-center text-muted-foreground py-8">
              <p>Nenhum dado da Aula Zero foi preenchido para este aluno.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
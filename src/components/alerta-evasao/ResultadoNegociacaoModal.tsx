import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, XCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export type ResultadoNegociacao = 'evasao' | 'ajuste_temporario' | 'ajuste_definitivo';

interface ResultadoNegociacaoModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (resultado: ResultadoNegociacao, dataFimAjuste?: Date) => void;
  isLoading?: boolean;
  alunoNome?: string;
}

export function ResultadoNegociacaoModal({
  open,
  onClose,
  onConfirm,
  isLoading = false,
  alunoNome
}: ResultadoNegociacaoModalProps) {
  const [resultadoSelecionado, setResultadoSelecionado] = useState<ResultadoNegociacao | null>(null);
  const [dataFimAjuste, setDataFimAjuste] = useState<Date | undefined>(undefined);

  const handleConfirm = () => {
    if (!resultadoSelecionado) return;
    
    if (resultadoSelecionado === 'ajuste_temporario' && !dataFimAjuste) return;
    
    onConfirm(resultadoSelecionado, dataFimAjuste);
    resetState();
  };

  const resetState = () => {
    setResultadoSelecionado(null);
    setDataFimAjuste(undefined);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const isConfirmDisabled = 
    !resultadoSelecionado || 
    (resultadoSelecionado === 'ajuste_temporario' && !dataFimAjuste) ||
    isLoading;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Resultado da Negociação Financeira</DialogTitle>
          <DialogDescription>
            {alunoNome 
              ? `Selecione o resultado da negociação para ${alunoNome}` 
              : 'Selecione o resultado da negociação'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {/* Opção: Evasão */}
          <Card 
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              resultadoSelecionado === 'evasao' && "ring-2 ring-red-500 bg-red-50"
            )}
            onClick={() => setResultadoSelecionado('evasao')}
          >
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <CardTitle className="text-base">Evasão</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <CardDescription className="text-sm">
                O aluno será desligado. Serão geradas tarefas para o administrativo:
              </CardDescription>
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">Remover do SGS</Badge>
                <Badge variant="outline" className="text-xs">Cancelar assinatura</Badge>
                <Badge variant="outline" className="text-xs">Remover WhatsApp</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Opção: Ajuste Temporário */}
          <Card 
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              resultadoSelecionado === 'ajuste_temporario' && "ring-2 ring-yellow-500 bg-yellow-50"
            )}
            onClick={() => setResultadoSelecionado('ajuste_temporario')}
          >
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-yellow-600" />
                <CardTitle className="text-base">Retenção - Ajuste Temporário</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <CardDescription className="text-sm">
                Valores serão ajustados temporariamente. Após o prazo, nova negociação será necessária.
              </CardDescription>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">Corrigir SGS</Badge>
                <Badge variant="outline" className="text-xs">Corrigir assinatura</Badge>
                <Badge variant="outline" className="text-xs">Nova negociação futura</Badge>
              </div>
              
              {resultadoSelecionado === 'ajuste_temporario' && (
                <div className="pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                  <Label className="text-sm font-medium">Data de fim do ajuste *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1",
                          !dataFimAjuste && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataFimAjuste 
                          ? format(dataFimAjuste, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                          : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dataFimAjuste}
                        onSelect={setDataFimAjuste}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Opção: Ajuste Definitivo */}
          <Card 
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              resultadoSelecionado === 'ajuste_definitivo' && "ring-2 ring-green-500 bg-green-50"
            )}
            onClick={() => setResultadoSelecionado('ajuste_definitivo')}
          >
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <CardTitle className="text-base">Retenção - Ajuste Definitivo</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <CardDescription className="text-sm">
                Valores serão ajustados permanentemente. O aluno será retido com sucesso.
              </CardDescription>
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">Corrigir SGS</Badge>
                <Badge variant="outline" className="text-xs">Corrigir assinatura</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isConfirmDisabled}
            className="flex-1"
          >
            {isLoading ? 'Processando...' : 'Confirmar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

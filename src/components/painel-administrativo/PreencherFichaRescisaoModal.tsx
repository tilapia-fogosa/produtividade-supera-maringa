import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { FichaRescisao } from "@/hooks/use-fichas-rescisao";

interface PreencherFichaRescisaoModalProps {
  ficha: FichaRescisao | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrint: (ficha: FichaRescisao, dadosExtras: DadosExtrasFicha) => void;
}

export interface DadosExtrasFicha {
  dataComunicacao: Date | undefined;
  pendenciaFinanceira: string;
  descontoNegociado: string;
}

export function PreencherFichaRescisaoModal({
  ficha,
  open,
  onOpenChange,
  onPrint,
}: PreencherFichaRescisaoModalProps) {
  const [dataComunicacao, setDataComunicacao] = useState<Date | undefined>(undefined);
  const [pendenciaFinanceira, setPendenciaFinanceira] = useState("");
  const [descontoNegociado, setDescontoNegociado] = useState("");

  const handlePrint = () => {
    if (!ficha) return;
    
    onPrint(ficha, {
      dataComunicacao,
      pendenciaFinanceira,
      descontoNegociado,
    });
    
    // Limpar campos após impressão
    setDataComunicacao(undefined);
    setPendenciaFinanceira("");
    setDescontoNegociado("");
    onOpenChange(false);
  };

  const handleClose = () => {
    setDataComunicacao(undefined);
    setPendenciaFinanceira("");
    setDescontoNegociado("");
    onOpenChange(false);
  };

  if (!ficha) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Preencher Ficha de Rescisão
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Aluno</p>
            <p className="font-medium">{ficha.aluno_nome}</p>
          </div>

          <div className="space-y-2">
            <Label>Data Comunicação Rescisão</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataComunicacao && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataComunicacao 
                    ? format(dataComunicacao, "dd/MM/yyyy", { locale: ptBR }) 
                    : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataComunicacao}
                  onSelect={setDataComunicacao}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Pendência Financeira (Mês Atual ou Anteriores)</Label>
            <Input
              placeholder="Ex: R$ 500,00 - Mensalidade Janeiro"
              value={pendenciaFinanceira}
              onChange={(e) => setPendenciaFinanceira(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Desconto Negociado</Label>
            <Input
              placeholder="Ex: 10% ou R$ 50,00"
              value={descontoNegociado}
              onChange={(e) => setDescontoNegociado(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handlePrint}>
            Imprimir Ficha
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useMemo } from "react";
import { format, addMonths, differenceInMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, FileText, Calculator } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";

interface PreencherFichaRescisaoModalProps {
  ficha: FichaRescisao | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrint: (ficha: FichaRescisao, dadosExtras: DadosExtrasFicha) => void;
}

export interface DadosExtrasFicha {
  dataComunicacao: Date | undefined;
  dataPrimeiraMensalidade: Date | undefined;
  valorMensalidade: number;
  pendenciaFinanceira: string;
  descontoNegociado: string;
}

export interface DadosCalculados {
  ultimaMensalidadeContrato: Date | null;
  mensalidadesAteRescisao: number;
  mensalidadesRestantes: number;
  mensalidadeProximoMes: number;
  totalRescisao: number;
}

export function PreencherFichaRescisaoModal({
  ficha,
  open,
  onOpenChange,
  onPrint,
}: PreencherFichaRescisaoModalProps) {
  const [dataComunicacao, setDataComunicacao] = useState<Date | undefined>(undefined);
  const [dataPrimeiraMensalidade, setDataPrimeiraMensalidade] = useState<Date | undefined>(undefined);
  const [valorMensalidade, setValorMensalidade] = useState<string>("");
  const [pendenciaFinanceira, setPendenciaFinanceira] = useState("");
  const [descontoNegociado, setDescontoNegociado] = useState("");

  // Inicializar valor da mensalidade do aluno quando disponível
  const valorMensalidadeNum = parseFloat(valorMensalidade.replace(",", ".")) || 0;

  // Cálculos automáticos
  const dadosCalculados = useMemo<DadosCalculados>(() => {
    if (!dataPrimeiraMensalidade || !dataComunicacao) {
      return {
        ultimaMensalidadeContrato: null,
        mensalidadesAteRescisao: 0,
        mensalidadesRestantes: 0,
        mensalidadeProximoMes: 0,
        totalRescisao: 0,
      };
    }

    // Última mensalidade em contrato = 18 meses após a primeira
    const ultimaMensalidadeContrato = addMonths(dataPrimeiraMensalidade, 17);

    // Mensalidades até rescisão = meses inteiros entre primeira mensalidade e comunicado
    const mesesDecorridos = differenceInMonths(dataComunicacao, dataPrimeiraMensalidade);
    const mensalidadesAteRescisao = Math.max(0, mesesDecorridos);

    // Mensalidades restantes = 18 - mensalidades até rescisão
    const mensalidadesRestantes = Math.max(0, 18 - mensalidadesAteRescisao);

    // Mensalidade próximo mês (aviso 30 dias)
    // Se o dia do comunicado for antes do dia da mensalidade, não cobra
    // Caso contrário, cobra 1 mensalidade adicional
    const diaVencimento = dataPrimeiraMensalidade.getDate();
    const diaComunicado = dataComunicacao.getDate();
    const mensalidadeProximoMes = diaComunicado >= diaVencimento ? valorMensalidadeNum : 0;

    // Total rescisão (apenas mensalidades restantes * valor proporcional - 10%)
    const valorRescisao = mensalidadesRestantes * (valorMensalidadeNum * 0.1);
    
    // Parse pendência financeira
    const pendenciaNum = parseFloat(pendenciaFinanceira.replace(/[^\d,.-]/g, "").replace(",", ".")) || 0;
    
    // Total = Pendência + Mensalidade Próximo Mês + Rescisão
    const totalRescisao = pendenciaNum + mensalidadeProximoMes + valorRescisao;

    return {
      ultimaMensalidadeContrato,
      mensalidadesAteRescisao,
      mensalidadesRestantes,
      mensalidadeProximoMes,
      totalRescisao,
    };
  }, [dataPrimeiraMensalidade, dataComunicacao, valorMensalidadeNum, pendenciaFinanceira]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const handlePrint = () => {
    if (!ficha) return;
    
    onPrint(ficha, {
      dataComunicacao,
      dataPrimeiraMensalidade,
      valorMensalidade: valorMensalidadeNum,
      pendenciaFinanceira,
      descontoNegociado,
    });
    
    // Limpar campos após impressão
    handleClose();
  };

  const handleClose = () => {
    setDataComunicacao(undefined);
    setDataPrimeiraMensalidade(undefined);
    setValorMensalidade("");
    setPendenciaFinanceira("");
    setDescontoNegociado("");
    onOpenChange(false);
  };

  // Inicializar valor da mensalidade do aluno
  const handleOpen = () => {
    if (ficha?.valor_mensalidade) {
      setValorMensalidade(ficha.valor_mensalidade.toString().replace(".", ","));
    }
  };

  if (!ficha) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" onOpenAutoFocus={handleOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Preencher Ficha de Rescisão
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Dados do Aluno */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Aluno</p>
            <p className="font-medium">{ficha.aluno_nome}</p>
          </div>

          {/* Dados de Entrada */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Primeira Mensalidade</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataPrimeiraMensalidade && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataPrimeiraMensalidade 
                      ? format(dataPrimeiraMensalidade, "dd/MM/yyyy", { locale: ptBR }) 
                      : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataPrimeiraMensalidade}
                    onSelect={setDataPrimeiraMensalidade}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Valor da Mensalidade</Label>
              <Input
                placeholder="R$ 399,00"
                value={valorMensalidade}
                onChange={(e) => setValorMensalidade(e.target.value)}
              />
            </div>
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

          <Separator />

          {/* Cálculos Automáticos */}
          {dataPrimeiraMensalidade && dataComunicacao && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calculator className="h-4 w-4" />
                Cálculo de Rescisão Contratual
              </div>
              
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Última Mensalidade em Contrato</span>
                  <span className="font-medium">
                    {dadosCalculados.ultimaMensalidadeContrato 
                      ? format(dadosCalculados.ultimaMensalidadeContrato, "dd/MM/yyyy", { locale: ptBR })
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Mensalidades até Rescisão</span>
                  <span className="font-medium">{dadosCalculados.mensalidadesAteRescisao}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Mensalidades Restantes</span>
                  <span className="font-medium">{dadosCalculados.mensalidadesRestantes}</span>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Valores Financeiros */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Pendências Financeiras (Mês Atual ou Anteriores)</Label>
              <Input
                placeholder="Ex: R$ 500,00"
                value={pendenciaFinanceira}
                onChange={(e) => setPendenciaFinanceira(e.target.value)}
              />
            </div>

            {dataPrimeiraMensalidade && dataComunicacao && (
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Mensalidade Próximo Mês (Aviso 30 dias)</span>
                  <span className="font-medium">{formatCurrency(dadosCalculados.mensalidadeProximoMes)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Rescisão (10% × Meses Restantes)</span>
                  <span className="font-medium">
                    {formatCurrency(dadosCalculados.mensalidadesRestantes * (valorMensalidadeNum * 0.1))}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Desconto Negociado</Label>
              <Input
                placeholder="Ex: R$ 50,00 ou 10%"
                value={descontoNegociado}
                onChange={(e) => setDescontoNegociado(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handlePrint} disabled={!dataComunicacao || !dataPrimeiraMensalidade}>
            Imprimir Ficha
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

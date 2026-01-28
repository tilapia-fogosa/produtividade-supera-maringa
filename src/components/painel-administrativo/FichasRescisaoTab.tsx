import { useState } from "react";
import { format, addMonths, differenceInMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, FileText, CalendarIcon, Check, Clock, ClipboardEdit } from "lucide-react";
import { PreencherFichaRescisaoModal, DadosExtrasFicha } from "./PreencherFichaRescisaoModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useFichasRescisao, FichaRescisao } from "@/hooks/use-fichas-rescisao";

export function FichasRescisaoTab() {
  const [filtroNome, setFiltroNome] = useState("");
  const [dataInicio, setDataInicio] = useState<Date | undefined>(undefined);
  const [dataFim, setDataFim] = useState<Date | undefined>(undefined);
  const [fichaParaPreencher, setFichaParaPreencher] = useState<FichaRescisao | null>(null);
  const [modalPreencherAberto, setModalPreencherAberto] = useState(false);

  const { data, isLoading, error } = useFichasRescisao({
    nome: filtroNome,
    dataInicio,
    dataFim,
  });

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return "-";
    }
  };

  const handleOpenPreencher = (ficha: FichaRescisao) => {
    setFichaParaPreencher(ficha);
    setModalPreencherAberto(true);
  };

  const handlePrintComDados = (ficha: FichaRescisao, dadosExtras: DadosExtrasFicha) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const dataComunicacaoFormatada = dadosExtras.dataComunicacao 
      ? format(dadosExtras.dataComunicacao, "dd/MM/yyyy", { locale: ptBR })
      : "Não informada";

    const dataPrimeiraMensalidadeFormatada = dadosExtras.dataPrimeiraMensalidade
      ? format(dadosExtras.dataPrimeiraMensalidade, "dd/MM/yyyy", { locale: ptBR })
      : "Não informada";

    // Cálculos
    let ultimaMensalidadeContrato = "";
    let mensalidadesAteRescisao = 0;
    let mensalidadesRestantes = 0;
    let mensalidadeProximoMes = 0;
    let valorRescisao = 0;

    if (dadosExtras.dataPrimeiraMensalidade && dadosExtras.dataComunicacao) {
      const ultimaData = addMonths(dadosExtras.dataPrimeiraMensalidade, 17);
      ultimaMensalidadeContrato = format(ultimaData, "dd/MM/yyyy", { locale: ptBR });

      const mesesDecorridos = differenceInMonths(dadosExtras.dataComunicacao, dadosExtras.dataPrimeiraMensalidade);
      mensalidadesAteRescisao = Math.max(0, mesesDecorridos);
      mensalidadesRestantes = Math.max(0, 18 - mensalidadesAteRescisao);

      const diaVencimento = dadosExtras.dataPrimeiraMensalidade.getDate();
      const diaComunicado = dadosExtras.dataComunicacao.getDate();
      mensalidadeProximoMes = diaComunicado >= diaVencimento ? dadosExtras.valorMensalidade : 0;
      
      valorRescisao = mensalidadesRestantes * (dadosExtras.valorMensalidade * 0.4);
    }

    const pendenciaNum = parseFloat(dadosExtras.pendenciaFinanceira.replace(/[^\d,.-]/g, "").replace(",", ".")) || 0;
    const descontoNum = parseFloat(dadosExtras.descontoNegociado.replace(/[^\d,.-]/g, "").replace(",", ".")) || 0;
    const total = pendenciaNum + mensalidadeProximoMes + valorRescisao;
    const totalLiquido = total - descontoNum;

    const formatCurrency = (value: number) => {
      return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    };

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ficha de Rescisão - ${ficha.aluno_nome}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              font-size: 14px;
            }
            h1 {
              text-align: center;
              margin-bottom: 30px;
              font-size: 20px;
            }
            .section {
              margin-bottom: 24px;
            }
            .section-title {
              font-weight: bold;
              font-size: 13px;
              color: #666;
              margin-bottom: 8px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            .row:last-child {
              border-bottom: none;
            }
            .label {
              color: #555;
            }
            .value {
              font-weight: 500;
              text-align: right;
            }
            .highlight {
              background-color: #f8f9fa;
              padding: 12px;
              border-radius: 6px;
              margin-top: 8px;
            }
            .total-row {
              font-weight: bold;
              font-size: 15px;
              padding: 12px 0;
              border-top: 2px solid #333;
              margin-top: 8px;
            }
            .signature-section {
              margin-top: 60px;
              display: flex;
              justify-content: space-between;
            }
            .signature-box {
              width: 45%;
              text-align: center;
            }
            .signature-line {
              border-top: 1px solid #333;
              margin-top: 50px;
              padding-top: 8px;
              font-size: 12px;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 11px;
              color: #999;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <h1>FICHA DE RESCISÃO</h1>
          
          <div class="section">
            <div class="section-title">Dados do Aluno</div>
            <div class="row">
              <span class="label">Nome</span>
              <span class="value">${ficha.aluno_nome}</span>
            </div>
            <div class="row">
              <span class="label">Turma</span>
              <span class="value">${ficha.turma_nome || "-"}</span>
            </div>
            <div class="row">
              <span class="label">Professor</span>
              <span class="value">${ficha.professor_nome || "-"}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Dados do Contrato</div>
            <div class="row">
              <span class="label">Data Primeira Mensalidade</span>
              <span class="value">${dataPrimeiraMensalidadeFormatada}</span>
            </div>
            <div class="row">
              <span class="label">Valor da Mensalidade</span>
              <span class="value">${formatCurrency(dadosExtras.valorMensalidade)}</span>
            </div>
            <div class="row">
              <span class="label">Data Comunicação Rescisão</span>
              <span class="value">${dataComunicacaoFormatada}</span>
            </div>
          </div>

          <div class="section highlight">
            <div class="section-title">Cálculo de Rescisão Contratual</div>
            <div class="row">
              <span class="label">Última Mensalidade em Contrato</span>
              <span class="value">${ultimaMensalidadeContrato || "-"}</span>
            </div>
            <div class="row">
              <span class="label">Mensalidades até Rescisão</span>
              <span class="value">${mensalidadesAteRescisao}</span>
            </div>
            <div class="row">
              <span class="label">Mensalidades Restantes</span>
              <span class="value">${mensalidadesRestantes}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Resumo Financeiro</div>
            <div class="row">
              <span class="label">Pendências Financeiras (Mês Atual ou Anteriores)</span>
              <span class="value">${dadosExtras.pendenciaFinanceira || formatCurrency(0)}</span>
            </div>
            <div class="row">
              <span class="label">Mensalidade Próximo Mês (Aviso 30 dias)</span>
              <span class="value">${formatCurrency(mensalidadeProximoMes)}</span>
            </div>
            <div class="row">
              <span class="label">Rescisão (40% × ${mensalidadesRestantes} meses restantes)</span>
              <span class="value">${formatCurrency(valorRescisao)}</span>
            </div>
            <div class="row total-row">
              <span class="label">Total</span>
              <span class="value">${formatCurrency(total)}</span>
            </div>
            <div class="row">
              <span class="label">Desconto Negociado</span>
              <span class="value">${dadosExtras.descontoNegociado || formatCurrency(0)}</span>
            </div>
            <div class="row total-row">
              <span class="label">Total Líquido</span>
              <span class="value">${formatCurrency(totalLiquido)}</span>
            </div>
          </div>

          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">Assinatura do Responsável</div>
            </div>
            <div class="signature-box">
              <div class="signature-line">Assinatura da Unidade</div>
            </div>
          </div>

          <div class="footer">
            <p>Documento gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  const handleClearFilters = () => {
    setFiltroNome("");
    setDataInicio(undefined);
    setDataFim(undefined);
  };

  const renderTable = (fichas: FichaRescisao[], isPendente: boolean) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome do Aluno</TableHead>
          <TableHead>Turma</TableHead>
          <TableHead>Professor</TableHead>
          <TableHead>Data</TableHead>
          {!isPendente && <TableHead>Concluído por</TableHead>}
          <TableHead className="text-center">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {!fichas?.length ? (
          <TableRow>
            <TableCell colSpan={isPendente ? 5 : 6} className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              Nenhuma ficha {isPendente ? "pendente" : "concluída"}
            </TableCell>
          </TableRow>
        ) : (
          fichas.map((ficha) => (
            <TableRow key={ficha.id}>
              <TableCell className="font-medium">{ficha.aluno_nome}</TableCell>
              <TableCell>{ficha.turma_nome || "-"}</TableCell>
              <TableCell>{ficha.professor_nome || "-"}</TableCell>
              <TableCell>{formatDate(ficha.data_criacao)}</TableCell>
              {!isPendente && <TableCell>{ficha.concluido_por_nome || "-"}</TableCell>}
              <TableCell className="text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenPreencher(ficha)}
                >
                  <ClipboardEdit className="h-4 w-4 mr-1" />
                  Preencher
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        Erro ao carregar dados
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-4 p-4 bg-muted/50 rounded-lg border">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted-foreground">Nome do Aluno</label>
          <Input
            placeholder="Filtrar por nome..."
            value={filtroNome}
            onChange={(e) => setFiltroNome(e.target.value)}
            className="w-[220px]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted-foreground">Data Início</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[160px] justify-start text-left font-normal",
                  !dataInicio && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dataInicio ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dataInicio}
                onSelect={setDataInicio}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted-foreground">Data Fim</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[160px] justify-start text-left font-normal",
                  !dataFim && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dataFim ? format(dataFim, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dataFim}
                onSelect={setDataFim}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button variant="ghost" size="sm" onClick={handleClearFilters}>
          Limpar filtros
        </Button>
      </div>

      {/* Seção Pendentes */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500" />
          <h3 className="text-lg font-semibold">Pendentes</h3>
          <span className="text-sm text-muted-foreground">({data?.pendentes.length || 0})</span>
        </div>
        <div className="rounded-md border">
          {renderTable(data?.pendentes || [], true)}
        </div>
      </div>

      {/* Seção Concluídas */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Check className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-semibold">Concluídas</h3>
          <span className="text-sm text-muted-foreground">({data?.concluidas.length || 0})</span>
        </div>
        <div className="rounded-md border">
          {renderTable(data?.concluidas || [], false)}
        </div>
      </div>

      <PreencherFichaRescisaoModal
        ficha={fichaParaPreencher}
        open={modalPreencherAberto}
        onOpenChange={setModalPreencherAberto}
        onPrint={handlePrintComDados}
      />
    </div>
  );
}

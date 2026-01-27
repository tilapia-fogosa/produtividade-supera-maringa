import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Printer, FileText, CalendarIcon, Check, Clock } from "lucide-react";
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

  const handlePrint = (ficha: FichaRescisao) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

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
            }
            h1 {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
              margin-bottom: 30px;
            }
            .field {
              margin-bottom: 20px;
              display: flex;
              border-bottom: 1px solid #ddd;
              padding-bottom: 10px;
            }
            .label {
              font-weight: bold;
              width: 200px;
              flex-shrink: 0;
            }
            .value {
              flex: 1;
            }
            .signature-section {
              margin-top: 80px;
              display: flex;
              justify-content: space-between;
            }
            .signature-box {
              width: 45%;
              text-align: center;
            }
            .signature-line {
              border-top: 1px solid #333;
              margin-top: 60px;
              padding-top: 10px;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <h1>FICHA DE RESCISÃO</h1>
          
          <div class="field">
            <span class="label">Nome do Aluno:</span>
            <span class="value">${ficha.aluno_nome}</span>
          </div>
          
          <div class="field">
            <span class="label">Turma:</span>
            <span class="value">${ficha.turma_nome || "Não informada"}</span>
          </div>
          
          <div class="field">
            <span class="label">Professor:</span>
            <span class="value">${ficha.professor_nome || "Não informado"}</span>
          </div>
          
          <div class="field">
            <span class="label">Data da Solicitação:</span>
            <span class="value">${formatDate(ficha.data_criacao)}</span>
          </div>

          <div class="field">
            <span class="label">Motivo da Rescisão:</span>
            <span class="value">_____________________________________________</span>
          </div>

          <div class="field">
            <span class="label">Observações:</span>
            <span class="value">_____________________________________________</span>
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
                  onClick={() => handlePrint(ficha)}
                >
                  <Printer className="h-4 w-4 mr-1" />
                  Imprimir
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
    </div>
  );
}

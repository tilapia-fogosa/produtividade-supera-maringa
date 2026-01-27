import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Printer, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useAlunosEvadidos, AlunoEvadido } from "@/hooks/use-alunos-evadidos";

export function FichasRescisaoTab() {
  const { data: alunos, isLoading, error } = useAlunosEvadidos();

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return "-";
    }
  };

  const handlePrint = (aluno: AlunoEvadido) => {
    // Abrir janela de impressão com os dados do aluno
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ficha de Rescisão - ${aluno.aluno_nome}</title>
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
            <span class="value">${aluno.aluno_nome}</span>
          </div>
          
          <div class="field">
            <span class="label">Turma:</span>
            <span class="value">${aluno.turma_nome || "Não informada"}</span>
          </div>
          
          <div class="field">
            <span class="label">Professor:</span>
            <span class="value">${aluno.professor_nome || "Não informado"}</span>
          </div>
          
          <div class="field">
            <span class="label">Data do Alerta:</span>
            <span class="value">${formatDate(aluno.data_alerta)}</span>
          </div>
          
          <div class="field">
            <span class="label">Data da Evasão:</span>
            <span class="value">${formatDate(aluno.data_evasao)}</span>
          </div>
          
          <div class="field">
            <span class="label">Origem do Alerta:</span>
            <span class="value">${aluno.origem_alerta}</span>
          </div>
          
          <div class="field">
            <span class="label">Observações:</span>
            <span class="value">${aluno.descritivo || "Nenhuma observação"}</span>
          </div>

          <div class="field">
            <span class="label">Motivo da Rescisão:</span>
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

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Aluno</TableHead>
              <TableHead>Turma</TableHead>
              <TableHead>Professor</TableHead>
              <TableHead>Data do Alerta</TableHead>
              <TableHead>Data da Evasão</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-destructive">
                  Erro ao carregar dados
                </TableCell>
              </TableRow>
            ) : !alunos?.length ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  Nenhum aluno em processo de rescisão
                </TableCell>
              </TableRow>
            ) : (
              alunos.map((aluno) => (
                <TableRow key={aluno.id}>
                  <TableCell className="font-medium">{aluno.aluno_nome}</TableCell>
                  <TableCell>{aluno.turma_nome || "-"}</TableCell>
                  <TableCell>{aluno.professor_nome || "-"}</TableCell>
                  <TableCell>{formatDate(aluno.data_alerta)}</TableCell>
                  <TableCell>{formatDate(aluno.data_evasao)}</TableCell>
                  <TableCell className="capitalize">{aluno.origem_alerta}</TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrint(aluno)}
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
      </div>

      {alunos && alunos.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Total: {alunos.length} aluno(s) em processo de rescisão
        </p>
      )}
    </div>
  );
}

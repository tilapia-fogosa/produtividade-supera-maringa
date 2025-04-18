
import React from 'react';
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from "@/hooks/use-toast";

interface ExportPdfButtonProps {
  tableRef: React.RefObject<HTMLDivElement>;
  turma: string;
  data: Date;
}

const ExportPdfButton: React.FC<ExportPdfButtonProps> = ({ tableRef, turma, data }) => {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async () => {
    if (!tableRef.current) return;

    try {
      setIsExporting(true);
      toast({
        title: "Exportando PDF",
        description: "Aguarde enquanto geramos seu arquivo...",
      });

      const canvas = await html2canvas(tableRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Configurar o PDF
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Adicionar cabeçalho
      pdf.setFontSize(16);
      pdf.text(`Diário de Turma - ${turma}`, 14, 15);
      
      pdf.setFontSize(12);
      pdf.text(`Data: ${new Intl.DateTimeFormat('pt-BR').format(data)}`, 14, 25);
      
      // Adicionar a imagem da tabela
      const imgWidth = pdfWidth - 28; // margem de 14mm em cada lado
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 14, 35, imgWidth, imgHeight);
      
      // Salvar o PDF
      pdf.save(`diario-${turma}-${data.toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "PDF Exportado",
        description: "Seu arquivo foi gerado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o PDF. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant="outline"
      className="gap-2"
    >
      <FileText className="h-4 w-4" />
      {isExporting ? "Exportando..." : "Exportar PDF"}
    </Button>
  );
};

export default ExportPdfButton;

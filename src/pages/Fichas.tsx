
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Download } from "lucide-react";
import FichaTurmaImprimivel from '@/components/fichas/FichaTurmaImprimivel';
import { toast } from '@/hooks/use-toast';
import { useTurmasFichas } from '@/hooks/use-turmas-fichas';
import html2pdf from 'html2pdf.js';

const Fichas = () => {
  const navigate = useNavigate();
  const { turmasDetalhes, loading, error } = useTurmasFichas();

  // Estado para mês e ano selecionados
  const dataAtual = new Date();
  const [mesSelecionado, setMesSelecionado] = useState(dataAtual.getMonth());
  const [anoSelecionado, setAnoSelecionado] = useState(dataAtual.getFullYear());
  const [iniciarSemanaAnterior, setIniciarSemanaAnterior] = useState(false);
  const [gerandoPDF, setGerandoPDF] = useState(false);

  const handleVoltar = () => {
    navigate('/devolutivas');
  };

  const handleSalvarPDF = async () => {
    setGerandoPDF(true);

    try {
      // Selecionar o elemento que contém todas as fichas
      const elemento = document.querySelector('.fichas-pdf-container') as HTMLElement;

      if (!elemento) {
        toast({
          title: "Erro",
          description: "Não foi possível encontrar as fichas para exportar",
          variant: "destructive"
        });
        return;
      }

      // Salvar estilos originais
      const originalWidth = elemento.style.width;
      const originalHeight = elemento.style.height;
      const originalMargin = elemento.style.margin;
      const originalPadding = elemento.style.padding;

      // Forçar estilos para garantir renderização correta (A4 Landscape)
      // 297mm é a largura do A4 em paisagem
      elemento.style.width = '297mm';
      elemento.style.height = 'auto';
      elemento.style.margin = '0';
      elemento.style.padding = '0';

      // Configurações do PDF
      const opt = {
        margin: 0,
        filename: `fichas-${mesNome.toLowerCase()}-${anoSelecionado}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'landscape',
          compress: true
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      // Gerar PDF
      await html2pdf().set(opt).from(elemento).save();

      // Restaurar estilos originais
      elemento.style.width = originalWidth;
      elemento.style.height = originalHeight;
      elemento.style.margin = originalMargin;
      elemento.style.padding = originalPadding;

      toast({
        title: "PDF gerado com sucesso!",
        description: `Arquivo: fichas-${mesNome.toLowerCase()}-${anoSelecionado}.pdf`,
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao tentar gerar o PDF. Tente novamente.",
        variant: "destructive"
      });

      // Tentar restaurar estilos em caso de erro também
      const elemento = document.querySelector('.fichas-pdf-container') as HTMLElement;
      if (elemento) {
        elemento.style.width = '';
        elemento.style.height = '';
        elemento.style.margin = '';
        elemento.style.padding = '';
      }
    } finally {
      setGerandoPDF(false);
    }
  };

  React.useEffect(() => {
    if (error) {
      toast({
        title: "Erro ao carregar turmas",
        description: error,
        variant: "destructive"
      });
    }
  }, [error]);

  // Filtrar turmas com pelo menos 1 aluno e ordenar por nome
  const turmasOrdenadas = turmasDetalhes
    .filter(item => item.alunos.length > 0)
    .sort((a, b) => a.turma.nome.localeCompare(b.turma.nome));

  // Array de meses para o seletor
  const meses = [
    { value: 0, label: 'Janeiro' },
    { value: 1, label: 'Fevereiro' },
    { value: 2, label: 'Março' },
    { value: 3, label: 'Abril' },
    { value: 4, label: 'Maio' },
    { value: 5, label: 'Junho' },
    { value: 6, label: 'Julho' },
    { value: 7, label: 'Agosto' },
    { value: 8, label: 'Setembro' },
    { value: 9, label: 'Outubro' },
    { value: 10, label: 'Novembro' },
    { value: 11, label: 'Dezembro' }
  ];

  // Array de anos (últimos 2 anos e próximos 2 anos)
  const anoAtual = new Date().getFullYear();
  const anos = [];
  for (let i = anoAtual - 2; i <= anoAtual + 2; i++) {
    anos.push(i);
  }

  const mesNome = meses.find(m => m.value === mesSelecionado)?.label || '';

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="container mx-auto py-4 px-2 print:p-0 print:m-0 print:max-w-none">
        <div className="no-print mb-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={handleVoltar}
              variant="outline"
              className="text-azul-500 border-orange-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>

            {turmasOrdenadas.length > 0 && (
              <Button
                onClick={handleSalvarPDF}
                style={{ backgroundColor: '#4112ce' }}
                className="hover:opacity-90 text-white"
                disabled={gerandoPDF}
              >
                <Download className="mr-2 h-4 w-4" />
                {gerandoPDF ? 'Gerando PDF...' : 'Salvar PDF'}
              </Button>
            )}
          </div>

          {/* Seletores de Mês e Ano com Toggle */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-azul-500">Período:</span>
              <Select
                value={mesSelecionado.toString()}
                onValueChange={(value) => setMesSelecionado(Number(value))}
              >
                <SelectTrigger className="w-40 border-orange-200">
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent className="bg-white border-orange-200">
                  {meses.map((mes) => (
                    <SelectItem key={mes.value} value={mes.value.toString()}>
                      {mes.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={anoSelecionado.toString()}
                onValueChange={(value) => setAnoSelecionado(Number(value))}
              >
                <SelectTrigger className="w-24 border-orange-200">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent className="bg-white border-orange-200">
                  {anos.map((ano) => (
                    <SelectItem key={ano} value={ano.toString()}>
                      {ano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Toggle para começar ciclo na semana anterior */}
            <div className="flex items-center gap-2">
              <Switch
                id="iniciar-semana-anterior"
                checked={iniciarSemanaAnterior}
                onCheckedChange={setIniciarSemanaAnterior}
              />
              <label
                htmlFor="iniciar-semana-anterior"
                className="text-sm font-medium text-azul-500 cursor-pointer"
              >
                Começar ciclo semana anterior
              </label>
            </div>
          </div>
        </div>

        <Card className="p-4 print:p-0 print:border-0 print:shadow-none print:bg-transparent">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <p className="text-azul-500">Carregando fichas de todas as turmas...</p>
            </div>
          ) : turmasOrdenadas.length > 0 ? (
            <div className="print:p-0 print:m-0">
              <h2 className="text-xl font-bold mb-4 text-azul-500 print:hidden">
                Fichas de Acompanhamento - {mesNome} {anoSelecionado} - {turmasOrdenadas.length} Turmas
                {iniciarSemanaAnterior && <span className="text-sm font-normal ml-2">(iniciando semana anterior)</span>}
              </h2>

              <div className="fichas-pdf-container space-y-8 print:space-y-0">
                {turmasOrdenadas.map((item) => (
                  <FichaTurmaImprimivel
                    key={item.turma.id}
                    turma={item.turma}
                    alunos={item.alunos}
                    mesSelecionado={mesSelecionado}
                    anoSelecionado={anoSelecionado}
                    iniciarSemanaAnterior={iniciarSemanaAnterior}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-azul-500">Nenhuma turma encontrada. Verifique se existem turmas cadastradas no sistema.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Fichas;

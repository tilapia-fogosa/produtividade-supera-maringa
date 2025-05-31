
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Printer } from "lucide-react";
import FichaTurmaImprimivel from '@/components/fichas/FichaTurmaImprimivel';
import { toast } from '@/hooks/use-toast';
import { useTurmasFichas } from '@/hooks/use-turmas-fichas';

const Fichas = () => {
  const navigate = useNavigate();
  const { turmasDetalhes, loading, error } = useTurmasFichas();
  
  // Estado para mês e ano selecionados
  const dataAtual = new Date();
  const [mesSelecionado, setMesSelecionado] = useState(dataAtual.getMonth());
  const [anoSelecionado, setAnoSelecionado] = useState(dataAtual.getFullYear());

  const handleVoltar = () => {
    navigate('/devolutivas');
  };

  const handlePrint = () => {
    window.print();
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

  // Ordenar as turmas por nome
  const turmasOrdenadas = [...turmasDetalhes].sort((a, b) => 
    a.turma.nome.localeCompare(b.turma.nome)
  );

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
      <div className="container mx-auto py-4 px-2 print:p-0">
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
                onClick={handlePrint}
                className="bg-azul-500 hover:bg-azul-600 text-white"
              >
                <Printer className="mr-2 h-4 w-4" /> Imprimir Todas
              </Button>
            )}
          </div>

          {/* Seletores de Mês e Ano */}
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
          </div>
        </div>
        
        <Card className="p-4 print:p-0 print:border-none print:shadow-none">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <p className="text-azul-500">Carregando fichas de todas as turmas...</p>
            </div>
          ) : turmasOrdenadas.length > 0 ? (
            <div>
              <h2 className="text-xl font-bold mb-4 text-azul-500 print:hidden">
                Fichas de Acompanhamento - {mesNome} {anoSelecionado} - {turmasOrdenadas.length} Turmas
              </h2>
              
              {turmasOrdenadas.map((item, index) => (
                <div key={item.turma.id} className={`mb-8 ${index > 0 ? 'print:mt-10' : ''}`}>
                  <FichaTurmaImprimivel 
                    turma={item.turma} 
                    alunos={item.alunos}
                    mesSelecionado={mesSelecionado}
                    anoSelecionado={anoSelecionado}
                  />
                  {index < turmasOrdenadas.length - 1 && (
                    <div className="print:page-break-after print:mb-0 mb-12"></div>
                  )}
                </div>
              ))}
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

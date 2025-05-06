
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Printer } from "lucide-react";
import FichaTurmaImprimivel from '@/components/fichas/FichaTurmaImprimivel';
import { toast } from '@/hooks/use-toast';
import { useTurmasFichas } from '@/hooks/use-turmas-fichas';

const Fichas = () => {
  const navigate = useNavigate();
  const { turmasDetalhes, loading, error } = useTurmasFichas();

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

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="container mx-auto py-4 px-2 print:p-0">
        <div className="no-print mb-4 flex items-center justify-between">
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
        
        <Card className="p-4 print:p-0 print:border-none print:shadow-none">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <p className="text-azul-500">Carregando fichas de todas as turmas...</p>
            </div>
          ) : turmasOrdenadas.length > 0 ? (
            <div>
              <h2 className="text-xl font-bold mb-4 text-azul-500 print:hidden">
                Fichas de Acompanhamento - {turmasOrdenadas.length} Turmas
              </h2>
              
              {turmasOrdenadas.map((item, index) => (
                <div key={item.turma.id} className={`mb-8 ${index > 0 ? 'print:mt-10' : ''}`}>
                  <FichaTurmaImprimivel 
                    turma={item.turma} 
                    alunos={item.alunos}
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

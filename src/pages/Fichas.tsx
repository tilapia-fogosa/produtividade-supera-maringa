
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Printer } from "lucide-react";
import { useTurmaDetalhes } from '@/hooks/use-turma-detalhes';
import FichaTurmaImprimivel from '@/components/fichas/FichaTurmaImprimivel';
import { toast } from '@/hooks/use-toast';

const Fichas = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [turmaSelecionada, setTurmaSelecionada] = useState<string | null>(null);
  const { turma, alunos, loading, error } = useTurmaDetalhes(turmaSelecionada);
  
  // Recuperamos o ID da turma se vier da página de produtividade
  useEffect(() => {
    const state = location.state as any;
    if (state?.turmaId) {
      console.log('Turma ID recebido na página de Fichas:', state.turmaId);
      setTurmaSelecionada(state.turmaId);
    }
  }, [location.state]);

  const handleVoltar = () => {
    if (location.state?.origem === 'produtividade' && location.state?.turmaId) {
      // Voltar para a página de produtividade se veio de lá
      navigate(`/turma/${location.state.turmaId}/produtividade`);
    } else if (turmaSelecionada) {
      // Se tiver uma turma selecionada, volta para a seleção
      setTurmaSelecionada(null);
    } else {
      // Caso contrário, volta para devolutivas
      navigate('/devolutivas');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    if (error) {
      toast({
        title: "Erro ao carregar turma",
        description: error,
        variant: "destructive"
      });
    }
  }, [error]);

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
          
          {turmaSelecionada && turma && (
            <Button 
              onClick={handlePrint}
              className="bg-azul-500 hover:bg-azul-600 text-white"
            >
              <Printer className="mr-2 h-4 w-4" /> Imprimir
            </Button>
          )}
        </div>
        
        <Card className="p-4 print:p-0 print:border-none print:shadow-none">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <p className="text-azul-500">Carregando dados da turma...</p>
            </div>
          ) : turmaSelecionada && turma ? (
            <FichaTurmaImprimivel 
              turma={turma} 
              alunos={alunos.map(a => ({ id: a.id, nome: a.nome }))} 
            />
          ) : (
            <SelecionarTurma onTurmaSelecionada={setTurmaSelecionada} />
          )}
        </Card>
      </div>
    </div>
  );
};

// Componente para selecionar a turma
const SelecionarTurma = ({ onTurmaSelecionada }: { onTurmaSelecionada: (turmaId: string) => void }) => {
  const navigate = useNavigate();
  
  const irParaSelecionarTurma = () => {
    navigate('/devolutivas/turmas', { 
      state: { serviceType: 'ficha_impressao' } 
    });
  };

  return (
    <div className="text-center py-8">
      <h2 className="text-lg font-semibold mb-4 text-azul-500">Selecione uma turma para gerar a ficha</h2>
      <Button 
        onClick={irParaSelecionarTurma}
        className="bg-azul-500 hover:bg-azul-600 text-white"
      >
        Selecionar Turma
      </Button>
    </div>
  );
};

export default Fichas;

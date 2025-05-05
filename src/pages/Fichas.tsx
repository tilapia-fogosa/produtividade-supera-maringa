
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useTurmaDetalhes } from '@/hooks/use-turma-detalhes';
import FichaTurmaImprimivel from '@/components/fichas/FichaTurmaImprimivel';

const Fichas = () => {
  const navigate = useNavigate();
  const [turmaSelecionada, setTurmaSelecionada] = useState<string | null>(null);
  const { turma, alunos, loading } = useTurmaDetalhes(turmaSelecionada);

  const handleVoltar = () => {
    if (turmaSelecionada) {
      setTurmaSelecionada(null);
    } else {
      navigate('/devolutivas');
    }
  };

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
        </div>
        
        <Card className="p-4 print:p-0 print:border-none print:shadow-none">
          {turmaSelecionada && turma ? (
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

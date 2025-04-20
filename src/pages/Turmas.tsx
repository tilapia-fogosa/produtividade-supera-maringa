
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTurmasPorDia } from '@/hooks/use-turmas-por-dia';
import DayTurmasList from '@/components/turmas/DayTurmasList';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Turmas = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { turmas, loading, serviceType } = useTurmasPorDia();
  const dia = location.state?.dia;

  console.log("Página Turmas - Dia recebido:", dia);
  console.log("Turmas encontradas:", turmas);

  const handleVoltar = () => {
    navigate('/dias-lancamento', { 
      state: { 
        serviceType 
      }
    });
  };
  
  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-orange-950 dark:to-slate-950 text-azul-500 dark:text-orange-100">
      <div className="container mx-auto py-4 px-2">
        <Button 
          onClick={handleVoltar} 
          variant="outline" 
          className="mb-4 text-azul-500 border-orange-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        
        <h1 className="text-xl font-bold mb-4">
          Turmas de {dia === 'segunda' ? 'Segunda-feira' : 
                    dia === 'terca' ? 'Terça-feira' : 
                    dia === 'quarta' ? 'Quarta-feira' : 
                    dia === 'quinta' ? 'Quinta-feira' : 
                    dia === 'sexta' ? 'Sexta-feira' : 
                    dia === 'sabado' ? 'Sábado' : 'Domingo'}
        </h1>
        
        <DayTurmasList turmas={turmas} loading={loading} />
      </div>
    </div>
  );
};

export default Turmas;

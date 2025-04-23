
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTurmasPorDia } from '@/hooks/use-turmas-por-dia';
import DayTurmasList from '@/components/turmas/DayTurmasList';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar } from 'lucide-react';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Turmas = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dia = location.state?.dia;
  const serviceType = location.state?.serviceType;
  const data = location.state?.data;
  
  console.log("Turmas - Dia selecionado:", dia);
  console.log("Turmas - Service Type:", serviceType);
  console.log("Turmas - Data selecionada:", data);
  
  const { turmas, loading } = useTurmasPorDia();

  const handleVoltar = () => {
    // Se for devolutiva, voltar para a página de devolutivas
    if (serviceType === 'devolutiva') {
      navigate('/devolutivas');
    } 
    // Se for diário de turma, voltar para a página de diário
    else if (serviceType === 'diario_turma') {
      navigate('/diario');
    }
    // Caso contrário, voltar para a página de dias de lançamento
    else {
      navigate('/dias-lancamento', { 
        state: { 
          serviceType 
        }
      });
    }
  };

  // Formatar o texto do título com base nas informações disponíveis
  const getTituloTexto = () => {
    let serviceName = '';
    if (serviceType === 'abrindo_horizontes') serviceName = 'Turmas para Abrindo Horizontes';
    else if (serviceType === 'devolutiva') serviceName = 'Turmas para Devolutivas';
    else if (serviceType === 'diario_turma') serviceName = 'Turmas para Diário';
    else serviceName = 'Turmas de';

    let dayText = '';
    if (dia) {
      dayText = dia === 'segunda' ? 'Segunda-feira' : 
               dia === 'terca' ? 'Terça-feira' : 
               dia === 'quarta' ? 'Quarta-feira' : 
               dia === 'quinta' ? 'Quinta-feira' : 
               dia === 'sexta' ? 'Sexta-feira' : 
               dia === 'sabado' ? 'Sábado' : 'Domingo';
    }
    
    // Se tiver uma data específica, usar essa informação
    if (data && serviceType === 'diario_turma') {
      return `${serviceName} - ${format(new Date(data), "dd 'de' MMMM", { locale: ptBR })}`;
    }
    
    // Caso contrário, usar o dia da semana
    return `${serviceName} - ${dayText}`;
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
          {getTituloTexto()}
        </h1>
        
        <DayTurmasList 
          turmas={turmas} 
          loading={loading} 
          serviceType={serviceType}
        />
      </div>
    </div>
  );
};

export default Turmas;

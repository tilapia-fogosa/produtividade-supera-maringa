
import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTurmasPorDia } from '@/hooks/use-turmas-por-dia';
import { useProjetoSaoRafael } from '@/hooks/use-projeto-sao-rafael';
import { useCurrentFuncionario } from '@/hooks/use-current-funcionario';
import DayTurmasList from '@/components/turmas/DayTurmasList';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { InformativoGlobalDialog } from '@/components/devolutivas/InformativoGlobalDialog';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const diasSemana = [
  { id: 'segunda', nome: 'Segunda-feira' },
  { id: 'terca', nome: 'Terça-feira' },
  { id: 'quarta', nome: 'Quarta-feira' },
  { id: 'quinta', nome: 'Quinta-feira' },
  { id: 'sexta', nome: 'Sexta-feira' },
  { id: 'sabado', nome: 'Sábado' },
];

const Turmas = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialDia = location.state?.dia;
  const serviceType = location.state?.serviceType;
  const data = location.state?.data;
  
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(initialDia);
  const [minhasTurmas, setMinhasTurmas] = useState(false);
  
  // Hook para buscar o funcionário atual
  const { funcionario, isFuncionario } = useCurrentFuncionario();
  
  console.log("Turmas - Dia selecionado:", diaSelecionado);
  console.log("Turmas - Service Type:", serviceType);
  console.log("Turmas - Data selecionada:", data);
  console.log("Turmas - Funcionário atual:", funcionario);
  
  // Para Projeto São Rafael, usar hook específico
  const { turmas: turmasProjetoSaoRafael, loading: loadingProjetoSaoRafael } = useProjetoSaoRafael();
  
  // Para outros casos, usar hook normal
  const { turmas: turmasNormais, loading: loadingNormais } = useTurmasPorDia(diaSelecionado);
  
  // Filtrar turmas se "Minhas Turmas" estiver ativo
  const turmasFiltradas = useMemo(() => {
    const turmasBase = serviceType === 'projeto_sao_rafael' ? turmasProjetoSaoRafael : turmasNormais;
    
    if (minhasTurmas && funcionario?.turma_id) {
      return turmasBase.filter(turma => turma.id === funcionario.turma_id);
    }
    
    return turmasBase;
  }, [serviceType, turmasProjetoSaoRafael, turmasNormais, minhasTurmas, funcionario?.turma_id]);
  
  // Definir quais dados usar baseado no serviceType
  const turmas = turmasFiltradas;
  const loading = serviceType === 'projeto_sao_rafael' ? loadingProjetoSaoRafael : loadingNormais;

  const handleVoltar = () => {
    // Se for Projeto São Rafael, voltar para devolutivas
    if (serviceType === 'projeto_sao_rafael') {
      navigate('/devolutivas');
    }
    // Se for devolutiva, voltar para a página de devolutivas
    else if (serviceType === 'devolutiva' || serviceType === 'ficha_impressao') {
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

  const handleDiaClick = (dia: string) => {
    setDiaSelecionado(dia);
    // Atualizar o estado da rota para manter o serviceType
    navigate(location.pathname, {
      state: {
        ...location.state,
        dia: dia
      },
      replace: true
    });
  };

  // Formatar o texto do título com base nas informações disponíveis
  const getTituloTexto = () => {
    let serviceName = '';
    if (serviceType === 'projeto_sao_rafael') serviceName = 'Projeto São Rafael';
    else if (serviceType === 'abrindo_horizontes') serviceName = 'Turmas para Abrindo Horizontes';
    else if (serviceType === 'devolutiva') serviceName = 'Turmas para Devolutivas';
    else if (serviceType === 'ficha_impressao') serviceName = 'Turmas para Fichas de Acompanhamento';
    else if (serviceType === 'diario_turma') serviceName = 'Turmas para Diário';
    else serviceName = 'Turmas de';

    let dayText = '';
    if (diaSelecionado && serviceType !== 'projeto_sao_rafael') {
      dayText = diaSelecionado === 'segunda' ? 'Segunda-feira' : 
               diaSelecionado === 'terca' ? 'Terça-feira' : 
               diaSelecionado === 'quarta' ? 'Quarta-feira' : 
               diaSelecionado === 'quinta' ? 'Quinta-feira' : 
               diaSelecionado === 'sexta' ? 'Sexta-feira' : 
               diaSelecionado === 'sabado' ? 'Sábado' : 'Domingo';
    }
    
    // Se for Projeto São Rafael, mostrar só o nome do projeto
    if (serviceType === 'projeto_sao_rafael') {
      return serviceName;
    }
    
    // Se tiver uma data específica, usar essa informação
    if (data && serviceType === 'diario_turma') {
      try {
        // Garantir que data é um objeto Date válido
        const dateObj = data instanceof Date ? data : new Date(data);
        if (!isNaN(dateObj.getTime())) {
          return `${serviceName} - ${format(dateObj, "dd 'de' MMMM", { locale: ptBR })}`;
        }
      } catch (err) {
        console.error("Erro ao formatar data:", err);
      }
    }
    
    // Caso contrário, usar o dia da semana ou texto padrão
    return dayText ? `${serviceName} - ${dayText}` : serviceName;
  };

  // Para Projeto São Rafael, não mostrar seletor de dias
  const mostrarSeletorDias = serviceType !== 'projeto_sao_rafael' && !diaSelecionado;
  const mostrarTurmas = serviceType === 'projeto_sao_rafael' || diaSelecionado;
  
  return (
    <div className="w-full min-h-screen bg-background dark:bg-background text-azul-500 dark:text-orange-100">
      <div className="container mx-auto py-4 px-2">
        <div className="flex items-center justify-between mb-4">
          <Button 
            onClick={handleVoltar} 
            variant="outline" 
            className="text-azul-500 border-orange-200"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          
          {/* Mostrar botão de informativo global apenas para devolutivas */}
          {serviceType === 'devolutiva' && (
            <InformativoGlobalDialog />
          )}
        </div>
        
        {/* Filtro Minhas Turmas - só mostra se for funcionário com turma vinculada */}
        {isFuncionario && funcionario?.turma_id && (
          <div className="flex items-center space-x-2 mb-4 p-3 bg-muted/30 rounded-lg">
            <Switch
              id="minhas-turmas"
              checked={minhasTurmas}
              onCheckedChange={setMinhasTurmas}
            />
            <Label htmlFor="minhas-turmas" className="flex items-center gap-2 cursor-pointer">
              <User className="h-4 w-4" />
              Minhas Turmas
            </Label>
          </div>
        )}
        
        <h1 className="text-xl font-bold mb-4">
          {getTituloTexto()}
        </h1>

        {/* Seletor de dias da semana - só mostra se não for Projeto São Rafael */}
        {mostrarSeletorDias && (
          <Card className="border-orange-200 bg-white mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-azul-500">Selecione o dia da semana</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4">
              {diasSemana.map((dia) => (
                <Button 
                  key={dia.id}
                  onClick={() => handleDiaClick(dia.id)}
                  className="w-full bg-azul-500 hover:bg-azul-600 text-white"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dia.nome}
                </Button>
              ))}
            </CardContent>
          </Card>
        )}
        
        {/* Mostrar lista de turmas */}
        {mostrarTurmas && (
          <>
            <DayTurmasList 
              turmas={turmas} 
              loading={loading} 
              serviceType={serviceType}
            />
            
            {/* Botão para voltar à seleção de dia - só mostra se não for Projeto São Rafael */}
            {turmas.length > 0 && serviceType !== 'projeto_sao_rafael' && (
              <Button 
                onClick={() => setDiaSelecionado(null)}
                variant="outline" 
                className="mt-4 border-orange-200 text-azul-500"
              >
                Selecionar outro dia
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Turmas;

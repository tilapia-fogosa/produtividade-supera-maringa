
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrendingUp, BookOpen, CalendarDays } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Lancamentos = () => {
  const navigate = useNavigate();

  const handleProdutividadeClick = () => {
    navigate('/professores', { state: { serviceType: 'produtividade' } });
  };

  const handleAHClick = () => {
    navigate('/professores', { state: { serviceType: 'abrindo_horizontes' } });
  };

  const handleDiarioTurmaClick = () => {
    navigate('/diario');
  };

  return (
    <div className="container mx-auto py-4 px-4 md:py-8">
      <h1 className="text-2xl font-bold mb-6 text-azul-500">Lançamentos</h1>
      
      <Card className="border-orange-200 bg-white">
        <CardHeader className="border-b border-orange-100">
          <CardTitle className="text-azul-500">Selecione o tipo de lançamento</CardTitle>
          <CardDescription className="text-azul-400">
            Escolha o tipo de lançamento que deseja realizar
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col space-y-4 p-6">
          <Button 
            size="lg" 
            className="py-8 text-lg bg-supera hover:bg-supera-600"
            onClick={handleProdutividadeClick}
          >
            <TrendingUp className="mr-2 h-6 w-6" />
            Lançar Produtividade de Sala
          </Button>

          <Button 
            size="lg" 
            className="py-8 text-lg border-orange-300 text-azul-500 hover:bg-orange-100"
            onClick={handleAHClick}
            variant="outline"
          >
            <BookOpen className="mr-2 h-6 w-6" />
            Lançar Abrindo Horizontes
          </Button>

          <Button 
            size="lg" 
            className="py-8 text-lg bg-azul-500 hover:bg-azul-600"
            onClick={handleDiarioTurmaClick}
          >
            <CalendarDays className="mr-2 h-6 w-6" />
            Diário de Turma
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Lancamentos;

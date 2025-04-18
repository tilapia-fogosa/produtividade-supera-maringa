
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrendingUp, BookOpen } from "lucide-react";

const Servicos = () => {
  const navigate = useNavigate();

  const handleProdutividadeClick = () => {
    navigate('/professores', { state: { serviceType: 'produtividade' } });
  };

  const handleAHClick = () => {
    navigate('/professores', { state: { serviceType: 'abrindo_horizontes' } });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-azul-500">Serviços</h1>
      
      <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
        <Button 
          size="lg" 
          className="py-8 text-lg bg-supera hover:bg-supera-600"
          onClick={handleProdutividadeClick}
        >
          <TrendingUp className="mr-2 h-6 w-6" />
          Lançar Produtividade
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
      </div>
    </div>
  );
};

export default Servicos;

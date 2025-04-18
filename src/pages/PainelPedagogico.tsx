
import { Card } from "@/components/ui/card";
import { PedagogicalKanban } from "@/components/pedagogical/PedagogicalKanban";

const PainelPedagogico = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-azul-500">Painel Pedagógico</h1>
      
      <div className="grid grid-cols-1 gap-4">
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4 text-azul-500">Controle de Evasões</h2>
          <PedagogicalKanban type="evasions" />
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4 text-azul-500">Controle de Faltas</h2>
          <PedagogicalKanban type="absences" />
        </Card>
      </div>
    </div>
  );
};

export default PainelPedagogico;

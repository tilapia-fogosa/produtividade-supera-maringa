
import { Card } from "@/components/ui/card";
import { PedagogicalKanban } from "@/components/pedagogical/PedagogicalKanban";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Folder, Clock } from "lucide-react";

const PainelPedagogico = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-azul-500">Painel Pedagógico</h1>
      
      <div className="grid grid-cols-1 gap-4">
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4 text-azul-500">Controle de Evasões</h2>
          
          <Tabs defaultValue="ativos">
            <TabsList>
              <TabsTrigger value="ativos" className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                <span>Ativos</span>
              </TabsTrigger>
              <TabsTrigger value="hibernando" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Hibernando</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="ativos" className="mt-4">
              <PedagogicalKanban type="evasions" showHibernating={false} />
            </TabsContent>
            
            <TabsContent value="hibernando" className="mt-4">
              <PedagogicalKanban type="evasions" showHibernating={true} />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default PainelPedagogico;

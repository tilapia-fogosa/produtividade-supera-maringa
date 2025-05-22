
import { Card } from "@/components/ui/card";
import { PedagogicalKanban } from "@/components/pedagogical/PedagogicalKanban";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Folder, Clock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const PainelPedagogico = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-azul-500">Painel Pedagógico</h1>
      
      <div className="grid grid-cols-1 gap-4">
        <Card className="p-4">
          <Tabs defaultValue="ativos">
            <TabsList>
              <TabsTrigger value="ativos" className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                <span>Ativos</span>
              </TabsTrigger>
              <TabsTrigger value="inativos" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Inativos</span>
              </TabsTrigger>
            </TabsList>
            
            <div className="mb-4 flex items-center gap-2 mt-4">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Filtrar por nome do aluno..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <TabsContent value="ativos">
              <PedagogicalKanban type="evasions" showHibernating={false} searchQuery={searchQuery} />
            </TabsContent>

            <TabsContent value="inativos">
              <PedagogicalKanban type="evasions" showHibernating={true} searchQuery={searchQuery} />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default PainelPedagogico;

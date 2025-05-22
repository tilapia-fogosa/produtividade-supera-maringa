
import { Card } from "@/components/ui/card";
import { PedagogicalKanban } from "@/components/pedagogical/PedagogicalKanban";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Folder, Clock, Search, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useKanbanCards } from "@/hooks/use-kanban-cards";
import { ResultadosEvasaoCard } from "@/components/pedagogical/ResultadosEvasaoCard";
import { ResultadosEvasaoChart } from "@/components/pedagogical/ResultadosEvasaoChart";

const PainelPedagogico = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { useResultadosEvasao } = useKanbanCards();
  const { data: resultadosEvasao, isLoading: carregandoResultados } = useResultadosEvasao();

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
              <TabsTrigger value="resultados" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span>Resultados</span>
              </TabsTrigger>
            </TabsList>
            
            <div className="mb-4 flex items-center gap-2 mt-4">
              {(["ativos", "inativos"].includes(window.location.hash.replace("#", "")) || !window.location.hash) && (
                <>
                  <Search className="h-4 w-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Filtrar por nome do aluno..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                </>
              )}
            </div>

            <TabsContent value="ativos">
              <PedagogicalKanban type="evasions" showHibernating={false} searchQuery={searchQuery} />
            </TabsContent>

            <TabsContent value="inativos">
              <PedagogicalKanban type="evasions" showHibernating={true} searchQuery={searchQuery} />
            </TabsContent>

            <TabsContent value="resultados">
              <div className="space-y-6">
                <ResultadosEvasaoCard 
                  resultados={resultadosEvasao || []} 
                  isLoading={carregandoResultados} 
                />
                
                {!carregandoResultados && resultadosEvasao && resultadosEvasao.length > 0 && (
                  <ResultadosEvasaoChart resultados={resultadosEvasao} />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default PainelPedagogico;

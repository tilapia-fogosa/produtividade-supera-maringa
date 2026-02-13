import { ClipboardList } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FichasRescisaoTab } from "@/components/painel-administrativo/FichasRescisaoTab";
import { AtividadesPosVendaTab } from "@/components/painel-administrativo/AtividadesPosVendaTab";

export default function PainelAdministrativo() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Painel Administrativo
          </h1>
          <p className="text-muted-foreground">
            Gestão e acompanhamento de processos administrativos
          </p>
        </div>
      </div>

      <Tabs defaultValue="atividades-pos-venda" className="w-full">
        <TabsList>
          <TabsTrigger value="atividades-pos-venda">Atividades Pós-Venda</TabsTrigger>
          <TabsTrigger value="fichas-rescisao">Fichas de Rescisão</TabsTrigger>
        </TabsList>

        <TabsContent value="atividades-pos-venda" className="mt-4">
          <AtividadesPosVendaTab />
        </TabsContent>

        <TabsContent value="fichas-rescisao" className="mt-4">
          <FichasRescisaoTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

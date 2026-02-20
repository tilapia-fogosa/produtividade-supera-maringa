
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

interface HistoricoViewProps {
  historico: string;
  onVoltar: () => void;
}

export function HistoricoView({ historico, onVoltar }: HistoricoViewProps) {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="container flex h-full items-center justify-center">
        <Card className="w-full max-w-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onVoltar}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold">Histórico do Aluno</h2>
          </div>
          
          <div className="bg-muted p-4 rounded-md whitespace-pre-line max-h-[60vh] overflow-y-auto">
            {historico}
          </div>
        </Card>
      </div>
    </div>
  );
}

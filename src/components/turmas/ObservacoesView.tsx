import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

interface ObservacoesViewProps {
  observacoes: string;
  alunoNome: string;
  dataReposicao: string;
  onVoltar: () => void;
}

export function ObservacoesView({ 
  observacoes, 
  alunoNome, 
  dataReposicao, 
  onVoltar 
}: ObservacoesViewProps) {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="container flex h-full items-center justify-center p-4">
        <Card className="w-full max-w-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onVoltar}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold">Observações da Reposição</h2>
              <p className="text-sm text-muted-foreground">
                {alunoNome} - {dataReposicao}
              </p>
            </div>
          </div>
          
          <div className="bg-muted p-4 rounded-md whitespace-pre-line max-h-[60vh] overflow-y-auto">
            {observacoes || "Nenhuma observação registrada."}
          </div>
        </Card>
      </div>
    </div>
  );
}
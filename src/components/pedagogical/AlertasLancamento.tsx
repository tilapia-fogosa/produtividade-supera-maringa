
import { useAlertasLancamento } from "@/hooks/use-alertas-lancamento";
import { Button } from "@/components/ui/button";
import { Archive, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function AlertasLancamento() {
  const { alertas, isLoading, arquivarAlerta } = useAlertasLancamento();

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
      </div>
    );
  }

  if (alertas.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <AlertCircle className="h-12 w-12 mx-auto mb-2 text-orange-500" />
        <p>Nenhum alerta de lançamento pendente</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alertas.map((alerta) => (
        <div
          key={alerta.id}
          className="bg-white p-4 rounded-lg shadow-sm border border-orange-100 flex items-center justify-between"
        >
          <div>
            <div className="font-medium text-azul-500">
              {alerta.turma.nome} - {alerta.turma.professor.nome}
            </div>
            <div className="text-sm text-gray-500">
              Aula do dia {format(new Date(alerta.data_aula), "dd 'de' MMMM", { locale: ptBR })} não lançada
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => arquivarAlerta.mutate(alerta.id)}
            disabled={arquivarAlerta.isPending}
            className="text-orange-600 border-orange-200 hover:bg-orange-50"
          >
            {arquivarAlerta.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (  
              <>
                <Archive className="h-4 w-4 mr-1" />
                Arquivar
              </>
            )}
          </Button>
        </div>
      ))}
    </div>
  );
}

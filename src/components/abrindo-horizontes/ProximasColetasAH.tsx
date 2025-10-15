import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProximasColetasAH } from "@/hooks/use-proximas-coletas-ah";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const ProximasColetasAH = () => {
  const { data: pessoas, isLoading } = useProximasColetasAH();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!pessoas || pessoas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Próximas Coletas
          </CardTitle>
          <CardDescription>
            Lista dos 30 alunos/funcionários que estão há mais tempo sem correção AH
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Nenhum dado disponível
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Próximas Coletas
        </CardTitle>
        <CardDescription>
          Lista dos 30 alunos/funcionários que estão há mais tempo sem correção AH
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pessoas.map((pessoa, index) => (
            <div
              key={pessoa.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                  {index + 1}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{pessoa.nome}</p>
                    <Badge variant="outline" className="text-xs">
                      {pessoa.origem === 'aluno' ? 'Aluno' : 'Funcionário'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {pessoa.turma_nome || 'Sem turma'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                {pessoa.ultima_correcao_ah ? (
                  <>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div className="text-right">
                      <p className="font-medium">
                        {pessoa.dias_desde_ultima_correcao} {pessoa.dias_desde_ultima_correcao === 1 ? 'dia' : 'dias'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(pessoa.ultima_correcao_ah), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </>
                ) : (
                  <Badge variant="secondary">Sem correção registrada</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

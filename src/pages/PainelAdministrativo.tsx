import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClipboardList, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { usePosMatricula } from "@/hooks/use-pos-matricula";

export default function PainelAdministrativo() {
  const { data: clientes, isLoading, error } = usePosMatricula();

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return "-";
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="secondary">-</Badge>;
    
    const statusMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ativo: "default",
      inativo: "destructive",
      pendente: "secondary",
    };

    return (
      <Badge variant={statusMap[status.toLowerCase()] || "outline"}>
        {status}
      </Badge>
    );
  };

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

      <Tabs defaultValue="pos-matricula" className="w-full">
        <TabsList>
          <TabsTrigger value="pos-matricula">Pós-Matrícula</TabsTrigger>
        </TabsList>

        <TabsContent value="pos-matricula" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Data da Matrícula</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-destructive">
                      Erro ao carregar dados
                    </TableCell>
                  </TableRow>
                ) : !clientes?.length ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      Nenhuma matrícula encontrada em 2026
                    </TableCell>
                  </TableRow>
                ) : (
                  clientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">
                        {cliente.name}
                      </TableCell>
                      <TableCell>{cliente.phone_number || "-"}</TableCell>
                      <TableCell>{cliente.email || "-"}</TableCell>
                      <TableCell>
                        {formatDate(cliente.data_matricula)}
                      </TableCell>
                      <TableCell>{getStatusBadge(cliente.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {clientes && clientes.length > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              Total: {clientes.length} matrícula(s) em 2026
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

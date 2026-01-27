import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClipboardList, Loader2, User, DollarSign, GraduationCap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { usePosMatricula, ClienteMatriculado } from "@/hooks/use-pos-matricula";
import { PosMatriculaDrawer, DrawerType } from "@/components/painel-administrativo/PosMatriculaDrawer";

export default function PainelAdministrativo() {
  const { data: clientes, isLoading, error } = usePosMatricula();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTipo, setDrawerTipo] = useState<DrawerType | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<ClienteMatriculado | null>(null);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return "-";
    }
  };

  const handleOpenDrawer = (tipo: DrawerType, cliente: ClienteMatriculado) => {
    setDrawerTipo(tipo);
    setSelectedCliente(cliente);
    setDrawerOpen(true);
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
                  <TableHead>Data da Matrícula</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead className="text-center">Dados Cadastrais</TableHead>
                  <TableHead className="text-center">Dados Comerciais</TableHead>
                  <TableHead className="text-center">Dados Pedagógicos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-destructive">
                      Erro ao carregar dados
                    </TableCell>
                  </TableRow>
                ) : !clientes?.length ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      Nenhuma matrícula encontrada em 2026
                    </TableCell>
                  </TableRow>
                ) : (
                  clientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">
                        {cliente.name}
                      </TableCell>
                      <TableCell>
                        {formatDate(cliente.data_matricula)}
                      </TableCell>
                      <TableCell>{cliente.vendedor_nome || "-"}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenDrawer("cadastrais", cliente)}
                        >
                          <User className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenDrawer("comerciais", cliente)}
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenDrawer("pedagogicos", cliente)}
                        >
                          <GraduationCap className="h-4 w-4" />
                        </Button>
                      </TableCell>
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

      <PosMatriculaDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        tipo={drawerTipo}
        cliente={selectedCliente}
      />
    </div>
  );
}

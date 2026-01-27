import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClipboardList, Loader2, User, DollarSign, GraduationCap, CheckSquare, Check, X, CalendarIcon, FileText } from "lucide-react";
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
import { usePosMatricula, ClienteMatriculado, PosMatriculaFilters } from "@/hooks/use-pos-matricula";
import { PosMatriculaDrawer, DrawerType } from "@/components/painel-administrativo/PosMatriculaDrawer";
import { FichasRescisaoTab } from "@/components/painel-administrativo/FichasRescisaoTab";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export default function PainelAdministrativo() {
  // Filtros
  const [dataInicio, setDataInicio] = useState<Date | undefined>(undefined);
  const [dataFim, setDataFim] = useState<Date | undefined>(undefined);
  const [statusConclusao, setStatusConclusao] = useState<'todos' | 'concluido' | 'pendente'>('todos');

  const filters: PosMatriculaFilters = {
    dataInicio,
    dataFim,
    statusConclusao,
  };

  const { data: clientes, isLoading, error } = usePosMatricula(filters);
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

  const handleClearFilters = () => {
    setDataInicio(undefined);
    setDataFim(undefined);
    setStatusConclusao('todos');
  };

  const isClienteCompleto = (cliente: ClienteMatriculado) => {
    return cliente.cadastrais_completo && 
           cliente.comerciais_completo && 
           cliente.pedagogicos_completo && 
           cliente.finais_completo;
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
          <TabsTrigger value="fichas-rescisao">Fichas de Rescisão</TabsTrigger>
        </TabsList>

        <TabsContent value="pos-matricula" className="mt-4 space-y-4">
          {/* Filtros */}
          <div className="flex flex-wrap items-end gap-4 p-4 bg-muted/50 rounded-lg border">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">Data Início</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !dataInicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataInicio ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataInicio}
                    onSelect={setDataInicio}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">Data Fim</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !dataFim && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataFim ? format(dataFim, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataFim}
                    onSelect={setDataFim}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <Select value={statusConclusao} onValueChange={(v) => setStatusConclusao(v as any)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              Limpar filtros
            </Button>
          </div>

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
                  <TableHead className="text-center">Dados Finais</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-destructive">
                      Erro ao carregar dados
                    </TableCell>
                  </TableRow>
                ) : !clientes?.length ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      Nenhuma matrícula encontrada
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
                          variant={cliente.cadastrais_completo ? "default" : "outline"}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenDrawer("cadastrais", cliente)}
                        >
                          <User className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant={cliente.comerciais_completo ? "default" : "outline"}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenDrawer("comerciais", cliente)}
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant={cliente.pedagogicos_completo ? "default" : "outline"}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenDrawer("pedagogicos", cliente)}
                        >
                          <GraduationCap className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant={cliente.finais_completo ? "default" : "outline"}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenDrawer("finais", cliente)}
                        >
                          <CheckSquare className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        {isClienteCompleto(cliente) ? (
                          <span className="inline-flex items-center gap-1 text-sm text-green-600">
                            <Check className="h-4 w-4" />
                            Concluído
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-sm text-amber-600">
                            <X className="h-4 w-4" />
                            Pendente
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {clientes && clientes.length > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              Total: {clientes.length} matrícula(s)
            </p>
          )}
        </TabsContent>

        <TabsContent value="fichas-rescisao" className="mt-4">
          <FichasRescisaoTab />
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

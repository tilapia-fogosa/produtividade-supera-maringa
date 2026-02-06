import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, User, DollarSign, GraduationCap, CheckSquare, Check, X, CalendarIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useAtividadesPosVenda, AtividadesPosVendaFilters, AtividadePosVenda } from "@/hooks/use-atividades-pos-venda";
import { PosMatriculaDrawer, DrawerType } from "./PosMatriculaDrawer";
import { ClienteMatriculado } from "@/hooks/use-pos-matricula";

export function AtividadesPosVendaTab() {
  // Filtros
  const [dataInicio, setDataInicio] = useState<Date | undefined>(undefined);
  const [dataFim, setDataFim] = useState<Date | undefined>(undefined);
  const [statusConclusao, setStatusConclusao] = useState<'todos' | 'concluido' | 'pendente'>('pendente');

  const filters: AtividadesPosVendaFilters = {
    dataInicio,
    dataFim,
    statusConclusao,
  };

  const { data: atividades, isLoading, error } = useAtividadesPosVenda(filters);
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

  const handleOpenDrawer = (tipo: DrawerType, atividade: AtividadePosVenda) => {
    // Converter AtividadePosVenda para ClienteMatriculado para compatibilidade com o drawer
    const clienteParaDrawer: ClienteMatriculado = {
      id: atividade.client_id,
      name: atividade.client_name,
      data_matricula: atividade.created_at,
      created_by: null,
      vendedor_nome: null,
      cadastrais_completo: atividade.cadastrais_completo,
      comerciais_completo: atividade.comerciais_completo,
      pedagogicos_completo: atividade.pedagogicos_completo,
      finais_completo: atividade.finais_completo,
    };
    
    setDrawerTipo(tipo);
    setSelectedCliente(clienteParaDrawer);
    setDrawerOpen(true);
  };

  const handleClearFilters = () => {
    setDataInicio(undefined);
    setDataFim(undefined);
    setStatusConclusao('todos');
  };

  const isAtividadeCompleta = (atividade: AtividadePosVenda) => {
    return atividade.cadastrais_completo && 
           atividade.comerciais_completo && 
           atividade.pedagogicos_completo && 
           atividade.finais_completo;
  };

  return (
    <div className="space-y-4">
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
              <TableHead className="text-center">Dados Iniciais</TableHead>
              <TableHead className="text-center">Dados Cadastrais</TableHead>
              <TableHead className="text-center">Dados Comerciais</TableHead>
              <TableHead className="text-center">Dados Pedagógicos</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-destructive">
                  Erro ao carregar dados
                </TableCell>
              </TableRow>
            ) : !atividades?.length ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Nenhuma atividade encontrada
                </TableCell>
              </TableRow>
            ) : (
              atividades.map((atividade) => {
                const iniciaisCompleto = atividade.finais_completo;
                
                return (
                  <TableRow key={atividade.id}>
                    <TableCell className="font-medium">
                      {atividade.client_name}
                    </TableCell>
                    <TableCell>
                      {formatDate(atividade.created_at)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant={iniciaisCompleto ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenDrawer("iniciais", atividade)}
                      >
                        <CheckSquare className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant={atividade.cadastrais_completo ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenDrawer("cadastrais", atividade)}
                        disabled={!iniciaisCompleto}
                      >
                        <User className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant={atividade.comerciais_completo ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenDrawer("comerciais", atividade)}
                        disabled={!iniciaisCompleto}
                      >
                        <DollarSign className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant={atividade.pedagogicos_completo ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenDrawer("pedagogicos", atividade)}
                        disabled={!iniciaisCompleto}
                      >
                        <GraduationCap className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      {isAtividadeCompleta(atividade) ? (
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
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {atividades && atividades.length > 0 && (
        <p className="mt-2 text-sm text-muted-foreground">
          Total: {atividades.length} atividade(s)
        </p>
      )}

      <PosMatriculaDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        tipo={drawerTipo}
        cliente={selectedCliente}
      />
    </div>
  );
}

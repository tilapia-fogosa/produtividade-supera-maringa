import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";
import { format, startOfDay, endOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { History, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ClientHistoryDrawer } from "./ClientHistoryDrawer";
import { EditClientDialog } from "./EditClientDialog";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { AdvancedFiltersModal, AdvancedFilters } from "./AdvancedFiltersModal";


export function ClientsTable() {
    const { activeUnit } = useActiveUnit();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // History Drawer State
    const [selectedHistoryClientId, setSelectedHistoryClientId] = useState<string | null>(null);
    const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

    // Edit Dialog State
    const [selectedEditClient, setSelectedEditClient] = useState<any | null>(null);
    const [isEditClientDialogOpen, setIsEditClientDialogOpen] = useState(false);

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState("");
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [filters, setFilters] = useState<AdvancedFilters>({
        dateFrom: undefined,
        dateTo: undefined,
        status: 'Todos',
        leadSource: 'Todos',
        ad: 'Todos',
        responsible: 'Todos',
    });

    const { data: clients, isLoading } = useQuery({
        queryKey: ['unit-clients', activeUnit?.id],
        queryFn: async () => {
            if (!activeUnit?.id) {
                console.log("No active unit ID provided to ClientsTable.");
                return [];
            }
            console.log("Fetching clients for unit:", activeUnit.id);
            // Fetch clients and their next activity using the RPC function to bypass RLS
            const { data, error } = await supabase.rpc('get_unit_clients_with_next_activity', {
                p_unit_id: activeUnit.id
            });

            if (error) {
                console.error("RPC Error:", error);
                throw error;
            }

            console.log("Clients fetched from RPC:", data);
            return data || [];
        },
        enabled: !!activeUnit?.id
    });

    const changeStatusMutation = useMutation({
        mutationFn: async (clientId: string) => {
            const { error } = await supabase
                .from('clients')
                .update({ status: 'novo-cadastro' })
                .eq('id', clientId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['unit-clients'] });
            toast({ title: "Sucesso", description: "Status do cliente alterado para novo-cadastro." });
        },
        onError: (error) => {
            console.error(error);
            toast({ title: "Erro", description: "Falha ao alterar o status do cliente.", variant: "destructive" });
        }
    });

    const deleteClientMutation = useMutation({
        mutationFn: async (clientId: string) => {
            const { error } = await supabase
                .from('clients')
                .delete()
                .eq('id', clientId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['unit-clients'] });
            toast({ title: "Sucesso", description: "Cliente excluído." });
        },
        onError: (error) => {
            console.error(error);
            toast({ title: "Erro", description: "Falha ao excluir cliente.", variant: "destructive" });
        }
    });

    const handleDelete = (clientId: string) => {
        if (window.confirm("Tem certeza que deseja excluir permanentemente este cliente e todo o seu histórico de atividades?")) {
            deleteClientMutation.mutate(clientId);
        }
    };

    // O cálculo de getNextActivity foi movido para o SQL RPC (next_activity_date, next_activity_type)

    const uniqueAds = Array.from(new Set(clients?.map(c => c.original_ad).filter(Boolean)));
    const uniqueResponsibles = Array.from(new Set(clients?.map(c => c.created_by_name).filter(Boolean)));
    const uniqueLeadSources = Array.from(new Set(clients?.map(c => c.lead_source).filter(Boolean)));

    const filteredClients = clients?.filter(client => {
        // Global Search
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
                (client.name && client.name.toLowerCase().includes(searchLower)) ||
                (client.phone_number && client.phone_number.includes(searchTerm));
            if (!matchesSearch) return false;
        }

        // Advanced Filters
        if (filters.status !== 'Todos' && client.status !== filters.status) return false;

        const clientLeadSource = client.lead_source || 'vazio';
        if (filters.leadSource !== 'Todos') {
            if (filters.leadSource === 'vazio' && client.lead_source) return false;
            if (filters.leadSource !== 'vazio' && client.lead_source !== filters.leadSource) return false;
        }

        const clientAd = client.original_ad || 'vazio';
        if (filters.ad !== 'Todos' && clientAd !== filters.ad) return false;

        const clientResponsible = client.created_by_name || 'vazio';
        if (filters.responsible !== 'Todos' && clientResponsible !== filters.responsible) return false;

        if (filters.dateFrom && client.created_at) {
            const clientDate = new Date(client.created_at);
            if (clientDate < startOfDay(filters.dateFrom)) return false;
        }

        if (filters.dateTo && client.created_at) {
            const clientDate = new Date(client.created_at);
            if (clientDate > endOfDay(filters.dateTo)) return false;
        }

        return true;
    });

    return (
        <Card className="shadow-sm">
            <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Input
                            type="text"
                            placeholder="Buscar por nome ou telefone..."
                            className="w-full sm:max-w-md bg-white border-slate-200 focus-visible:ring-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button
                        variant="outline"
                        className="shrink-0 gap-2 border-slate-200"
                        onClick={() => setIsFiltersOpen(true)}
                    >
                        <Filter className="h-4 w-4" />
                        Filtros
                    </Button>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Telefone</TableHead>
                                <TableHead>Origem</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Próxima Atividade</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground animate-pulse">
                                        Carregando clientes...
                                    </TableCell>
                                </TableRow>
                            ) : filteredClients?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        Nenhum cliente encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredClients?.map((client) => {
                                    return (
                                        <TableRow key={client.id}>
                                            <TableCell className="font-medium">{client.name}</TableCell>
                                            <TableCell>{client.phone_number || '-'}</TableCell>
                                            <TableCell><Badge variant="outline">{client.lead_source || 'Desconhecida'}</Badge></TableCell>
                                            <TableCell>{client.status}</TableCell>
                                            <TableCell>
                                                {client.next_activity_date ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-semibold">{client.next_activity_type}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {format(new Date(client.next_activity_date), "dd/MM/yyyy 'às' HH:mm")}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Sem atividade pendente</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50"
                                                        title="Marcar como Novo Cadastro"
                                                        onClick={() => {
                                                            if (window.confirm("Deseja voltar o status deste cliente para 'novo-cadastro'?")) {
                                                                changeStatusMutation.mutate(client.id);
                                                            }
                                                        }}
                                                    >
                                                        <ArrowLeft className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" title="Histórico" onClick={() => { setSelectedHistoryClientId(client.id); setIsHistoryDrawerOpen(true); }}>
                                                        <History className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" title="Editar" onClick={() => { setSelectedEditClient(client); setIsEditClientDialogOpen(true); }}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        title="Excluir"
                                                        onClick={() => handleDelete(client.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            <ClientHistoryDrawer
                open={isHistoryDrawerOpen}
                onOpenChange={setIsHistoryDrawerOpen}
                clientId={selectedHistoryClientId}
            />

            <EditClientDialog
                open={isEditClientDialogOpen}
                onOpenChange={setIsEditClientDialogOpen}
                client={selectedEditClient}
            />

            <AdvancedFiltersModal
                isOpen={isFiltersOpen}
                onClose={() => setIsFiltersOpen(false)}
                filters={filters}
                onFiltersChange={setFilters}
                uniqueAds={uniqueAds as string[]}
                uniqueResponsibles={uniqueResponsibles as string[]}
                uniqueLeadSources={uniqueLeadSources as string[]}
            />
        </Card>
    );
}

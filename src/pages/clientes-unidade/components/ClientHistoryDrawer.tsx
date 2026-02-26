import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, Phone, MessageCircle, FileText, User } from "lucide-react";

interface ClientHistoryDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: string | null;
}

export function ClientHistoryDrawer({ open, onOpenChange, clientId }: ClientHistoryDrawerProps) {
    const { data: client, isLoading: isLoadingClient } = useQuery({
        queryKey: ['client-details', clientId],
        queryFn: async () => {
            if (!clientId) return null;
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('id', clientId)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!clientId && open
    });

    const { data: activities, isLoading: isLoadingActivities } = useQuery({
        queryKey: ['client-activities-history', clientId],
        queryFn: async () => {
            if (!clientId) return [];
            const { data, error } = await supabase
                .from('client_activities')
                .select(`
                    id,
                    tipo_atividade,
                    description,
                    next_contact_date,
                    status,
                    created_at,
                    creator:profiles!client_activities_created_by_fkey (full_name)
                `)
                .eq('client_id', clientId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        },
        enabled: !!clientId && open
    });

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'Tentativa de Contato': return <Phone className="h-4 w-4 text-blue-500" />;
            case 'Contato Efetivo': return <MessageCircle className="h-4 w-4 text-orange-500" />;
            case 'Agendamento': return <Calendar className="h-4 w-4 text-purple-500" />;
            case 'Atendimento': return <User className="h-4 w-4 text-green-500" />;
            case 'Matrícula': return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
            default: return <FileText className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md md:max-w-lg border-l flex flex-col h-full right-0">
                <SheetHeader className="pb-4 border-b">
                    <SheetTitle>Histórico de Atividades</SheetTitle>
                    <SheetDescription>
                        {isLoadingClient ? "Carregando cliente..." : client?.name}
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-1 -mx-6 px-6 py-4">
                    {isLoadingActivities ? (
                        <div className="flex justify-center items-center py-10">
                            <span className="text-sm text-muted-foreground animate-pulse">Carregando histórico...</span>
                        </div>
                    ) : !activities || activities.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground text-sm flex flex-col items-center gap-2">
                            <FileText className="h-8 w-8 text-gray-300" />
                            Nenhuma atividade registrada para este cliente.
                        </div>
                    ) : (
                        <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 pb-4">
                            {activities.map((activity: any, index: number) => (
                                <div key={activity.id} className="relative pl-6">
                                    <div className="absolute -left-[17px] top-1 bg-white border-2 border-slate-200 rounded-full p-1.5">
                                        {getActivityIcon(activity.tipo_atividade)}
                                    </div>

                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 shadow-sm relative">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="text-sm font-semibold text-slate-900">{activity.tipo_atividade}</h4>
                                                <span className="text-xs text-muted-foreground block mt-0.5">
                                                    Registrado em {format(new Date(activity.created_at), "dd/MM/yyyy 'às' HH:mm")}
                                                </span>
                                            </div>
                                            {activity.status && (
                                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-white">
                                                    {activity.status}
                                                </Badge>
                                            )}
                                        </div>

                                        {activity.description && (
                                            <div className="text-sm text-slate-700 bg-white p-2 rounded border border-slate-100 mt-2">
                                                {activity.description}
                                            </div>
                                        )}

                                        {activity.next_contact_date && (
                                            <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-orange-50 text-orange-700 px-2 py-1.5 rounded-md inline-flex w-full">
                                                <Calendar className="h-3.5 w-3.5" />
                                                Data Agendada: {format(new Date(activity.next_contact_date), "dd/MM/yyyy 'às' HH:mm")}
                                            </div>
                                        )}

                                        {activity.creator?.full_name && (
                                            <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1 border-t pt-2">
                                                <User className="h-3 w-3" />
                                                Por: {activity.creator.full_name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}

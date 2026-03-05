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
                    tipo_contato,
                    notes,
                    next_contact_date,
                    active,
                    created_at,
                    created_by
                `)
                .eq('client_id', clientId)
                .eq('active', true)
                .order('created_at', { ascending: false });
            if (error) throw error;
            
            // Buscar nomes dos autores
            const creatorIds = [...new Set(data?.map(a => a.created_by).filter(Boolean) || [])];
            let creatorsMap: Record<string, string> = {};
            if (creatorIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .in('id', creatorIds);
                if (profiles) {
                    creatorsMap = Object.fromEntries(profiles.map(p => [p.id, p.full_name || '']));
                }
            }
            
            return (data || []).map(a => ({
                ...a,
                creator_name: creatorsMap[a.created_by] || null
            }));
        },
        enabled: !!clientId && open
    });

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'Tentativa de Contato': return <Phone className="h-3 w-3 text-blue-500" />;
            case 'Contato Efetivo': return <MessageCircle className="h-3 w-3 text-orange-500" />;
            case 'Agendamento': return <Calendar className="h-3 w-3 text-purple-500" />;
            case 'Atendimento': return <User className="h-3 w-3 text-green-500" />;
            case 'Matrícula': return <CheckCircle2 className="h-3 w-3 text-emerald-600" />;
            default: return <FileText className="h-3 w-3 text-gray-500" />;
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md md:max-w-lg border-l flex flex-col h-full right-0">
                <SheetHeader className="pb-3 border-b">
                    <SheetTitle className="text-base">Histórico de Atividades</SheetTitle>
                    <SheetDescription className="text-xs">
                        {isLoadingClient ? "Carregando cliente..." : client?.name}
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-1 -mx-6 px-6 py-3">
                    {isLoadingActivities ? (
                        <div className="flex justify-center items-center py-10">
                            <span className="text-xs text-muted-foreground animate-pulse">Carregando histórico...</span>
                        </div>
                    ) : !activities || activities.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground text-xs flex flex-col items-center gap-2">
                            <FileText className="h-6 w-6 text-gray-300" />
                            Nenhuma atividade registrada para este cliente.
                        </div>
                    ) : (
                        <div className="relative border-l border-slate-200 ml-3 space-y-3 pb-2">
                            {activities.map((activity: any, index: number) => (
                                <div key={activity.id} className="relative pl-5">
                                    <div className="absolute -left-[13px] top-1 bg-white border border-slate-200 rounded-full p-1">
                                        {getActivityIcon(activity.tipo_atividade)}
                                    </div>

                                    <div className="bg-slate-50 rounded-md p-2 border border-slate-100 shadow-sm">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="min-w-0">
                                                <h4 className="text-xs font-semibold text-slate-900 leading-tight">{activity.tipo_atividade}</h4>
                                                <span className="text-[10px] text-muted-foreground block mt-0.5">
                                                    {format(new Date(activity.created_at), "dd/MM/yyyy 'às' HH:mm")}
                                                </span>
                                            </div>
                                            {activity.tipo_contato && (
                                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-white flex-shrink-0">
                                                    {activity.tipo_contato}
                                                </Badge>
                                            )}
                                        </div>

                                        {activity.notes && (
                                            <div className="text-[11px] text-slate-700 bg-white p-1.5 rounded border border-slate-100 mt-1.5 leading-snug">
                                                {activity.notes}
                                            </div>
                                        )}

                                        {activity.next_contact_date && (
                                            <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-orange-700 bg-orange-50 px-1.5 py-1 rounded">
                                                <Calendar className="h-3 w-3 flex-shrink-0" />
                                                Agendado: {format(new Date(activity.next_contact_date), "dd/MM/yyyy 'às' HH:mm")}
                                            </div>
                                        )}

                                        {activity.creator_name && (
                                            <div className="mt-1.5 text-[10px] text-muted-foreground flex items-center gap-1 border-t border-slate-100 pt-1.5">
                                                <User className="h-2.5 w-2.5" />
                                                {activity.creator_name}
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

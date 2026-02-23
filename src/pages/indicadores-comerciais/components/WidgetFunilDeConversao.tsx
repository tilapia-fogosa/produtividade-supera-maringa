import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardDateFilter } from "./DashboardDateFilter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FunnelChart, Funnel, Tooltip, LabelList, ResponsiveContainer, Cell } from "recharts";
import { useUserUnit } from "@/components/kanban/hooks/useUserUnit";

const COLORS = ['#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12'];

export function WidgetFunilDeConversao() {
    const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
    const { data: userUnits } = useUserUnit();

    const { data: funnelData, isLoading } = useQuery({
        queryKey: ['commercial-funnel', dateRange?.start, dateRange?.end, userUnits],
        queryFn: async () => {
            if (!dateRange || !userUnits || userUnits.length === 0) return [];

            const unitIds = userUnits.map(u => u.unit_id);

            const { data, error } = await supabase.rpc('get_commercial_funnel', {
                p_unit_ids: unitIds,
                p_start_date: dateRange.start.toISOString(),
                p_end_date: dateRange.end.toISOString()
            });

            if (error) {
                console.error("Error fetching funnel:", error);
                throw error;
            }

            return data.map((item: any) => ({
                name: item.stage,
                value: Number(item.client_count)
            }));
        },
        enabled: !!dateRange && !!userUnits && userUnits.length > 0
    });

    return (
        <Card className="col-span-full shadow-sm border-t-4 border-t-[#f97316]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl font-bold text-slate-800">Funil de Conversão de Leads</CardTitle>
                <DashboardDateFilter onDateChange={(start, end) => setDateRange({ start, end })} />
            </CardHeader>
            <CardContent>
                <div className="h-[320px] w-full mt-4">
                    {isLoading ? (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground animate-pulse">Carregando funil...</div>
                    ) : funnelData && funnelData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <FunnelChart>
                                <Tooltip formatter={(value: number) => [value, "Clientes Únicos"]} cursor={{ fill: 'transparent' }} />
                                <Funnel
                                    dataKey="value"
                                    data={funnelData}
                                    isAnimationActive
                                >
                                    <LabelList position="right" fill="#333" stroke="none" dataKey="name" fontSize={14} fontWeight="bold" />
                                    <LabelList position="center" fill="#fff" stroke="none" dataKey="value" fontSize={16} fontWeight="bold" />
                                    {
                                        funnelData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))
                                    }
                                </Funnel>
                            </FunnelChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">Nenhum dado encontrado para o período.</div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

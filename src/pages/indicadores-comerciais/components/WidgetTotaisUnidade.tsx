import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardDateFilter } from "./DashboardDateFilter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUserUnit } from "@/components/kanban/hooks/useUserUnit";

export function WidgetTotaisUnidade() {
    const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
    const { data: userUnits } = useUserUnit();

    // Ocultar Widget se o usuário tem apenas 1 unidade ou nenhuma
    if (!userUnits || userUnits.length <= 1) {
        return null;
    }

    // Define hook inside standard flow, early return must not break hooks rules...
    // Wait, early return above breaks hooks rule! Let's refactor.
    return <WidgetTotaisUnidadeInner userUnits={userUnits} />;
}

function WidgetTotaisUnidadeInner({ userUnits }: { userUnits: any[] }) {
    const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);

    const { data: unitData, isLoading } = useQuery({
        queryKey: ['commercial-unit-perf', dateRange?.start, dateRange?.end, userUnits],
        queryFn: async () => {
            if (!dateRange || !userUnits || userUnits.length === 0) return [];
            const { data, error } = await supabase.rpc('get_unit_performance', {
                p_unit_ids: userUnits.map(u => u.unit_id),
                p_start_date: dateRange.start.toISOString(),
                p_end_date: dateRange.end.toISOString()
            });
            if (error) throw error;
            return data || [];
        },
        enabled: !!dateRange && !!userUnits && userUnits.length > 0
    });

    const calculateRates = (row: any) => {
        const ceRate = row.total_contacts > 0 ? (row.effective_contacts / row.total_contacts) * 100 : 0;
        const agRate = row.effective_contacts > 0 ? (row.scheduled_visits / row.effective_contacts) * 100 : 0;
        const atRate = row.scheduled_visits > 0 ? (row.completed_visits / row.scheduled_visits) * 100 : 0;
        const maRate = row.completed_visits > 0 ? (row.enrollments / row.completed_visits) * 100 : 0;
        return { ceRate, agRate, atRate, maRate };
    };

    const totals = unitData?.reduce((acc: any, row: any) => {
        return {
            new_clients: acc.new_clients + Number(row.new_clients),
            total_contacts: acc.total_contacts + Number(row.total_contacts),
            effective_contacts: acc.effective_contacts + Number(row.effective_contacts),
            scheduled_visits: acc.scheduled_visits + Number(row.scheduled_visits),
            awaiting_visits: acc.awaiting_visits + Number(row.awaiting_visits),
            completed_visits: acc.completed_visits + Number(row.completed_visits),
            enrollments: acc.enrollments + Number(row.enrollments),
        }
    }, { new_clients: 0, total_contacts: 0, effective_contacts: 0, scheduled_visits: 0, awaiting_visits: 0, completed_visits: 0, enrollments: 0 });

    return (
        <Card className="col-span-full shadow-sm mt-8 border-t-4 border-t-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                <CardTitle className="text-xl font-bold text-slate-800">Totais por Unidade</CardTitle>
                <DashboardDateFilter onDateChange={(start, end) => setDateRange({ start, end })} />
            </CardHeader>
            <CardContent className="pt-4 overflow-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent [&>th]:px-2.5">
                            <TableHead className="bg-[#FEC6A1] text-xs font-semibold text-slate-900 border-r border-white">Unidade</TableHead>
                            <TableHead className="text-center whitespace-pre-line text-xs font-semibold">{"Novos\nClientes"}</TableHead>
                            <TableHead className="text-center whitespace-pre-line text-xs font-semibold">{"Total de\nContatos"}</TableHead>
                            <TableHead className="text-center whitespace-pre-line text-xs font-semibold">{"Contatos\nEfetivos"}</TableHead>
                            <TableHead className="text-center bg-[#FEC6A1] text-xs font-semibold text-slate-900 border-r border-l border-white">% CE</TableHead>
                            <TableHead className="text-center whitespace-pre-line text-xs font-semibold">{"Visitas\nAgendadas"}</TableHead>
                            <TableHead className="text-center bg-[#FEC6A1] text-xs font-semibold text-slate-900 border-r border-l border-white">% AG</TableHead>
                            <TableHead className="text-center whitespace-pre-line text-xs font-semibold">{"Visitas\nAguardadas"}</TableHead>
                            <TableHead className="text-center whitespace-pre-line text-xs font-semibold">{"Visitas\nRealizadas"}</TableHead>
                            <TableHead className="text-center bg-[#FEC6A1] text-xs font-semibold text-slate-900 border-r border-l border-white">% AT</TableHead>
                            <TableHead className="text-center whitespace-pre-line text-xs font-semibold">{"Matrí-\nculas"}</TableHead>
                            <TableHead className="text-center bg-[#FEC6A1] text-xs font-semibold text-slate-900 border-l border-white">% MA</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={12} className="text-center text-xs py-4 text-muted-foreground animate-pulse">Carregando Unidades...</TableCell></TableRow>
                        ) : unitData?.map((row: any) => {
                            const rates = calculateRates(row);
                            return (
                                <TableRow key={row.unit_name} className="hover:bg-muted/50 [&>td]:px-2.5">
                                    <TableCell className="bg-[#FEC6A1]/40 text-xs py-2 font-medium">{row.unit_name}</TableCell>
                                    <TableCell className="text-center text-xs py-2">{row.new_clients}</TableCell>
                                    <TableCell className="text-center text-xs py-2">{row.total_contacts}</TableCell>
                                    <TableCell className="text-center text-xs py-2">{row.effective_contacts}</TableCell>
                                    <TableCell className="text-center bg-[#FEC6A1]/40 text-xs py-2 font-semibold text-[#c2410c]">{rates.ceRate.toFixed(1)}%</TableCell>
                                    <TableCell className="text-center text-xs py-2">{row.scheduled_visits}</TableCell>
                                    <TableCell className="text-center bg-[#FEC6A1]/40 text-xs py-2 font-semibold text-[#c2410c]">{rates.agRate.toFixed(1)}%</TableCell>
                                    <TableCell className="text-center text-xs py-2">{row.awaiting_visits}</TableCell>
                                    <TableCell className="text-center text-xs py-2">{row.completed_visits}</TableCell>
                                    <TableCell className="text-center bg-[#FEC6A1]/40 text-xs py-2 font-semibold text-[#c2410c]">{rates.atRate.toFixed(1)}%</TableCell>
                                    <TableCell className="text-center text-xs py-2">{row.enrollments}</TableCell>
                                    <TableCell className="text-center bg-[#FEC6A1]/40 text-xs py-2 font-semibold text-[#c2410c]">{rates.maRate.toFixed(1)}%</TableCell>
                                </TableRow>
                            );
                        })}
                        {totals && (
                            <TableRow className="hover:bg-muted/50 [&>td]:px-2.5 font-bold border-t-2">
                                <TableCell className="bg-[#FEC6A1] text-xs py-3">TOTAL</TableCell>
                                <TableCell className="text-center text-xs py-3">{totals.new_clients}</TableCell>
                                <TableCell className="text-center text-xs py-3">{totals.total_contacts}</TableCell>
                                <TableCell className="text-center text-xs py-3">{totals.effective_contacts}</TableCell>
                                <TableCell className="text-center bg-[#FEC6A1] text-xs py-3">{calculateRates(totals).ceRate.toFixed(1)}%</TableCell>
                                <TableCell className="text-center text-xs py-3">{totals.scheduled_visits}</TableCell>
                                <TableCell className="text-center bg-[#FEC6A1] text-xs py-3">{calculateRates(totals).agRate.toFixed(1)}%</TableCell>
                                <TableCell className="text-center text-xs py-3">{totals.awaiting_visits}</TableCell>
                                <TableCell className="text-center text-xs py-3">{totals.completed_visits}</TableCell>
                                <TableCell className="text-center bg-[#FEC6A1] text-xs py-3">{calculateRates(totals).atRate.toFixed(1)}%</TableCell>
                                <TableCell className="text-center text-xs py-3">{totals.enrollments}</TableCell>
                                <TableCell className="text-center bg-[#FEC6A1] text-xs py-3">{calculateRates(totals).maRate.toFixed(1)}%</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

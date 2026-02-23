import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardDateFilter } from "./DashboardDateFilter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserUnit } from "@/components/kanban/hooks/useUserUnit";

export function WidgetTotaisUsuario() {
    const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
    const { data: userUnits } = useUserUnit();
    const [activeTab, setActiveTab] = useState("sdr");

    const { data: sdrData, isLoading: isLoadingSdr } = useQuery({
        queryKey: ['commercial-sdr-perf', dateRange?.start, dateRange?.end, userUnits],
        queryFn: async () => {
            if (!dateRange || !userUnits || userUnits.length === 0) return [];
            const { data, error } = await supabase.rpc('get_sdr_performance', {
                p_unit_ids: userUnits.map(u => u.unit_id),
                p_start_date: dateRange.start.toISOString(),
                p_end_date: dateRange.end.toISOString()
            });
            if (error) throw error;
            return data || [];
        },
        enabled: !!dateRange && !!userUnits && userUnits.length > 0 && activeTab === 'sdr'
    });

    const { data: closerData, isLoading: isLoadingCloser } = useQuery({
        queryKey: ['commercial-closer-perf', dateRange?.start, dateRange?.end, userUnits],
        queryFn: async () => {
            if (!dateRange || !userUnits || userUnits.length === 0) return [];
            const { data, error } = await supabase.rpc('get_closer_performance', {
                p_unit_ids: userUnits.map(u => u.unit_id),
                p_start_date: dateRange.start.toISOString(),
                p_end_date: dateRange.end.toISOString()
            });
            if (error) throw error;
            return data || [];
        },
        enabled: !!dateRange && !!userUnits && userUnits.length > 0 && activeTab === 'closer'
    });

    const calculateRates = (row: any) => {
        const ceRate = row.total_contacts > 0 ? (row.effective_contacts / row.total_contacts) * 100 : 0;
        const agRate = row.effective_contacts > 0 ? (row.scheduled_visits / row.effective_contacts) * 100 : 0;
        const atRateSdr = row.scheduled_visits > 0 ? (row.completed_visits / row.scheduled_visits) * 100 : 0;
        const maRate = row.completed_visits > 0 ? (row.enrollments / row.completed_visits) * 100 : 0;

        // Closer specific
        const atRateCloser = row.assigned_visits > 0 ? (row.completed_visits / row.assigned_visits) * 100 : 0;

        return { ceRate, agRate, atRateSdr, atRateCloser, maRate };
    };

    // Calculate totals
    const sdrTotals = sdrData?.reduce((acc: any, row: any) => {
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

    const closerTotals = closerData?.reduce((acc: any, row: any) => {
        return {
            assigned_visits: acc.assigned_visits + Number(row.assigned_visits),
            completed_visits: acc.completed_visits + Number(row.completed_visits),
            enrollments: acc.enrollments + Number(row.enrollments),
        }
    }, { assigned_visits: 0, completed_visits: 0, enrollments: 0 });

    return (
        <Card className="col-span-full shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                <CardTitle className="text-xl font-bold text-slate-800">Totais por Usuário</CardTitle>
                <DashboardDateFilter onDateChange={(start, end) => setDateRange({ start, end })} />
            </CardHeader>
            <CardContent className="pt-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="sdr">Agendadores (SDR)</TabsTrigger>
                        <TabsTrigger value="closer">Fechadores (Consultores)</TabsTrigger>
                    </TabsList>

                    <TabsContent value="sdr" className="w-full overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent [&>th]:px-2.5">
                                    <TableHead className="bg-[#FEC6A1] text-xs font-semibold text-slate-900 border-r border-white">Usuário</TableHead>
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
                                {isLoadingSdr ? (
                                    <TableRow><TableCell colSpan={12} className="text-center text-xs py-4 text-muted-foreground animate-pulse">Carregando SDRs...</TableCell></TableRow>
                                ) : sdrData?.map((row: any) => {
                                    const rates = calculateRates(row);
                                    return (
                                        <TableRow key={row.user_name} className="hover:bg-muted/50 [&>td]:px-2.5">
                                            <TableCell className="bg-[#FEC6A1]/40 text-xs py-2 font-medium">{row.user_name}</TableCell>
                                            <TableCell className="text-center text-xs py-2">{row.new_clients}</TableCell>
                                            <TableCell className="text-center text-xs py-2">{row.total_contacts}</TableCell>
                                            <TableCell className="text-center text-xs py-2">{row.effective_contacts}</TableCell>
                                            <TableCell className="text-center bg-[#FEC6A1]/40 text-xs py-2 font-semibold text-[#c2410c]">{rates.ceRate.toFixed(1)}%</TableCell>
                                            <TableCell className="text-center text-xs py-2">{row.scheduled_visits}</TableCell>
                                            <TableCell className="text-center bg-[#FEC6A1]/40 text-xs py-2 font-semibold text-[#c2410c]">{rates.agRate.toFixed(1)}%</TableCell>
                                            <TableCell className="text-center text-xs py-2">{row.awaiting_visits}</TableCell>
                                            <TableCell className="text-center text-xs py-2">{row.completed_visits}</TableCell>
                                            <TableCell className="text-center bg-[#FEC6A1]/40 text-xs py-2 font-semibold text-[#c2410c]">{rates.atRateSdr.toFixed(1)}%</TableCell>
                                            <TableCell className="text-center text-xs py-2">{row.enrollments}</TableCell>
                                            <TableCell className="text-center bg-[#FEC6A1]/40 text-xs py-2 font-semibold text-[#c2410c]">{rates.maRate.toFixed(1)}%</TableCell>
                                        </TableRow>
                                    );
                                })}
                                {sdrTotals && (
                                    <TableRow className="hover:bg-muted/50 [&>td]:px-2.5 font-bold border-t-2">
                                        <TableCell className="bg-[#FEC6A1] text-xs py-3">TOTAL</TableCell>
                                        <TableCell className="text-center text-xs py-3">{sdrTotals.new_clients}</TableCell>
                                        <TableCell className="text-center text-xs py-3">{sdrTotals.total_contacts}</TableCell>
                                        <TableCell className="text-center text-xs py-3">{sdrTotals.effective_contacts}</TableCell>
                                        <TableCell className="text-center bg-[#FEC6A1] text-xs py-3">{calculateRates(sdrTotals).ceRate.toFixed(1)}%</TableCell>
                                        <TableCell className="text-center text-xs py-3">{sdrTotals.scheduled_visits}</TableCell>
                                        <TableCell className="text-center bg-[#FEC6A1] text-xs py-3">{calculateRates(sdrTotals).agRate.toFixed(1)}%</TableCell>
                                        <TableCell className="text-center text-xs py-3">{sdrTotals.awaiting_visits}</TableCell>
                                        <TableCell className="text-center text-xs py-3">{sdrTotals.completed_visits}</TableCell>
                                        <TableCell className="text-center bg-[#FEC6A1] text-xs py-3">{calculateRates(sdrTotals).atRateSdr.toFixed(1)}%</TableCell>
                                        <TableCell className="text-center text-xs py-3">{sdrTotals.enrollments}</TableCell>
                                        <TableCell className="text-center bg-[#FEC6A1] text-xs py-3">{calculateRates(sdrTotals).maRate.toFixed(1)}%</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TabsContent>

                    <TabsContent value="closer" className="w-full overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent [&>th]:px-2.5">
                                    <TableHead className="bg-[#FEC6A1] text-xs font-semibold text-slate-900 border-r border-white">Usuário</TableHead>
                                    <TableHead className="text-center whitespace-pre-line text-xs font-semibold">{"Atendimentos\nAtribuídos"}</TableHead>
                                    <TableHead className="text-center whitespace-pre-line text-xs font-semibold">{"Visitas\nRealizadas"}</TableHead>
                                    <TableHead className="text-center bg-[#FEC6A1] text-xs font-semibold text-slate-900 border-r border-l border-white">% AT</TableHead>
                                    <TableHead className="text-center whitespace-pre-line text-xs font-semibold">{"Matrí-\nculas"}</TableHead>
                                    <TableHead className="text-center bg-[#FEC6A1] text-xs font-semibold text-slate-900 border-l border-white">% MA</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingCloser ? (
                                    <TableRow><TableCell colSpan={6} className="text-center text-xs py-4 text-muted-foreground animate-pulse">Carregando Consultores...</TableCell></TableRow>
                                ) : closerData?.map((row: any) => {
                                    const rates = calculateRates(row);
                                    return (
                                        <TableRow key={row.user_name} className="hover:bg-muted/50 [&>td]:px-2.5">
                                            <TableCell className="bg-[#FEC6A1]/40 text-xs py-2 font-medium">{row.user_name}</TableCell>
                                            <TableCell className="text-center text-xs py-2">{row.assigned_visits}</TableCell>
                                            <TableCell className="text-center text-xs py-2">{row.completed_visits}</TableCell>
                                            <TableCell className="text-center bg-[#FEC6A1]/40 text-xs py-2 font-semibold text-[#c2410c]">{rates.atRateCloser.toFixed(1)}%</TableCell>
                                            <TableCell className="text-center text-xs py-2">{row.enrollments}</TableCell>
                                            <TableCell className="text-center bg-[#FEC6A1]/40 text-xs py-2 font-semibold text-[#c2410c]">{rates.maRate.toFixed(1)}%</TableCell>
                                        </TableRow>
                                    );
                                })}
                                {closerTotals && (
                                    <TableRow className="hover:bg-muted/50 [&>td]:px-2.5 font-bold border-t-2">
                                        <TableCell className="bg-[#FEC6A1] text-xs py-3">TOTAL</TableCell>
                                        <TableCell className="text-center text-xs py-3">{closerTotals.assigned_visits}</TableCell>
                                        <TableCell className="text-center text-xs py-3">{closerTotals.completed_visits}</TableCell>
                                        <TableCell className="text-center bg-[#FEC6A1] text-xs py-3">{calculateRates(closerTotals).atRateCloser.toFixed(1)}%</TableCell>
                                        <TableCell className="text-center text-xs py-3">{closerTotals.enrollments}</TableCell>
                                        <TableCell className="text-center bg-[#FEC6A1] text-xs py-3">{calculateRates(closerTotals).maRate.toFixed(1)}%</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}

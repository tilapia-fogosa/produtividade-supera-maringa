import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardDateFilter } from "./DashboardDateFilter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useUserUnit } from "@/components/kanban/hooks/useUserUnit";

const KADIN_SOURCES = [
    'facebook',
    'instagram',
    'google',
    'landing page',
    'outros',
    'whatsapp'
];

export function WidgetTotaisOrigem() {
    const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
    const { data: userUnits } = useUserUnit();

    const { data: originData, isLoading } = useQuery({
        queryKey: ['commercial-origin-perf', dateRange?.start, dateRange?.end, userUnits],
        queryFn: async () => {
            if (!dateRange || !userUnits || userUnits.length === 0) return [];
            const { data, error } = await supabase.rpc('get_origin_performance', {
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

    const calculateGroupTotals = (data: any[]) => {
        if (!data || data.length === 0) return null;
        return data.reduce((acc: any, row: any) => {
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
    };

    // Grouping logic
    const kadinData = originData?.filter((row: any) => KADIN_SOURCES.includes(row.source_name.toLowerCase())) || [];
    const internalData = originData?.filter((row: any) => !KADIN_SOURCES.includes(row.source_name.toLowerCase())) || [];

    const kadinTotals = calculateGroupTotals(kadinData);
    const internalTotals = calculateGroupTotals(internalData);
    const grandTotals = calculateGroupTotals(originData || []);

    const renderTableHeaders = () => (
        <TableHeader>
            <TableRow className="hover:bg-transparent [&>th]:px-2.5">
                <TableHead className="bg-[#FEC6A1] text-xs font-semibold text-slate-900 border-r border-white w-[180px]">Origem</TableHead>
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
    );

    const renderRows = (data: any[]) => (
        data.map((row: any) => {
            const rates = calculateRates(row);
            return (
                <TableRow key={row.source_name} className="hover:bg-muted/50 [&>td]:px-2.5">
                    <TableCell className="bg-[#FEC6A1]/40 text-xs py-2 font-medium capitalize truncate max-w-[180px]" title={row.source_name}>{row.source_name}</TableCell>
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
        })
    );

    const renderEmptyRow = () => (
        <TableRow>
            <TableCell colSpan={12} className="text-center text-xs py-4 text-muted-foreground">
                Nenhum dado encontrado para este grupo no período.
            </TableCell>
        </TableRow>
    );

    return (
        <Card className="col-span-full shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                <CardTitle className="text-xl font-bold text-slate-800">Totais por Origem (Lead Source)</CardTitle>
                <DashboardDateFilter onDateChange={(start, end) => setDateRange({ start, end })} />
            </CardHeader>
            <CardContent className="pt-4 overflow-auto">
                {isLoading ? (
                    <div className="w-full text-center text-xs py-8 text-muted-foreground animate-pulse">Carregando Origens...</div>
                ) : (
                    <Accordion type="multiple" defaultValue={["item-kadin", "item-internal"]} className="w-full">

                        {/* 1. Agência KADIN */}
                        <AccordionItem value="item-kadin" className="border rounded-md mb-4 bg-white shadow-sm px-4">
                            <AccordionTrigger className="hover:no-underline py-3">
                                <div className="flex flex-col text-left">
                                    <span className="font-bold text-slate-800 text-base">Agência Kadin</span>
                                    <span className="text-xs text-muted-foreground font-normal">
                                        Campanhas de marketing (Facebook, Instagram, Google, Landing Page, WhatsApp, Outros)
                                    </span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-4 border-t mt-2">
                                <div className="rounded-md border overflow-hidden">
                                    <Table>
                                        {renderTableHeaders()}
                                        <TableBody>
                                            {kadinData.length > 0 ? renderRows(kadinData) : renderEmptyRow()}
                                            {kadinTotals && kadinData.length > 0 && (
                                                <TableRow className="hover:bg-muted/50 [&>td]:px-2.5 font-bold border-t-2 bg-slate-50">
                                                    <TableCell className="bg-[#FEC6A1] text-xs py-3">SUBTOTAL KADIN</TableCell>
                                                    <TableCell className="text-center text-xs py-3">{kadinTotals.new_clients}</TableCell>
                                                    <TableCell className="text-center text-xs py-3">{kadinTotals.total_contacts}</TableCell>
                                                    <TableCell className="text-center text-xs py-3">{kadinTotals.effective_contacts}</TableCell>
                                                    <TableCell className="text-center bg-[#FEC6A1] text-xs py-3">{calculateRates(kadinTotals).ceRate.toFixed(1)}%</TableCell>
                                                    <TableCell className="text-center text-xs py-3">{kadinTotals.scheduled_visits}</TableCell>
                                                    <TableCell className="text-center bg-[#FEC6A1] text-xs py-3">{calculateRates(kadinTotals).agRate.toFixed(1)}%</TableCell>
                                                    <TableCell className="text-center text-xs py-3">{kadinTotals.awaiting_visits}</TableCell>
                                                    <TableCell className="text-center text-xs py-3">{kadinTotals.completed_visits}</TableCell>
                                                    <TableCell className="text-center bg-[#FEC6A1] text-xs py-3">{calculateRates(kadinTotals).atRate.toFixed(1)}%</TableCell>
                                                    <TableCell className="text-center text-xs py-3">{kadinTotals.enrollments}</TableCell>
                                                    <TableCell className="text-center bg-[#FEC6A1] text-xs py-3">{calculateRates(kadinTotals).maRate.toFixed(1)}%</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        {/* 2. Internos */}
                        <AccordionItem value="item-internal" className="border rounded-md mb-6 bg-white shadow-sm px-4">
                            <AccordionTrigger className="hover:no-underline py-3">
                                <div className="flex flex-col text-left">
                                    <span className="font-bold text-slate-800 text-base">Captação Interna & Orgânica</span>
                                    <span className="text-xs text-muted-foreground font-normal">
                                        Cadastros avulsos, indicações, panfletagem e ações locais da Unidade
                                    </span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-4 border-t mt-2">
                                <div className="rounded-md border overflow-hidden">
                                    <Table>
                                        {renderTableHeaders()}
                                        <TableBody>
                                            {internalData.length > 0 ? renderRows(internalData) : renderEmptyRow()}
                                            {internalTotals && internalData.length > 0 && (
                                                <TableRow className="hover:bg-muted/50 [&>td]:px-2.5 font-bold border-t-2 bg-slate-50">
                                                    <TableCell className="bg-[#FEC6A1] text-xs py-3">SUBTOTAL INTERNO</TableCell>
                                                    <TableCell className="text-center text-xs py-3">{internalTotals.new_clients}</TableCell>
                                                    <TableCell className="text-center text-xs py-3">{internalTotals.total_contacts}</TableCell>
                                                    <TableCell className="text-center text-xs py-3">{internalTotals.effective_contacts}</TableCell>
                                                    <TableCell className="text-center bg-[#FEC6A1] text-xs py-3">{calculateRates(internalTotals).ceRate.toFixed(1)}%</TableCell>
                                                    <TableCell className="text-center text-xs py-3">{internalTotals.scheduled_visits}</TableCell>
                                                    <TableCell className="text-center bg-[#FEC6A1] text-xs py-3">{calculateRates(internalTotals).agRate.toFixed(1)}%</TableCell>
                                                    <TableCell className="text-center text-xs py-3">{internalTotals.awaiting_visits}</TableCell>
                                                    <TableCell className="text-center text-xs py-3">{internalTotals.completed_visits}</TableCell>
                                                    <TableCell className="text-center bg-[#FEC6A1] text-xs py-3">{calculateRates(internalTotals).atRate.toFixed(1)}%</TableCell>
                                                    <TableCell className="text-center text-xs py-3">{internalTotals.enrollments}</TableCell>
                                                    <TableCell className="text-center bg-[#FEC6A1] text-xs py-3">{calculateRates(internalTotals).maRate.toFixed(1)}%</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                    </Accordion>
                )}

                {/* GRAND TOTAL */}
                {!isLoading && grandTotals && (
                    <div className="mt-2 rounded-md border-2 border-slate-800 overflow-hidden bg-white shadow-sm">
                        <Table>
                            <TableBody>
                                <TableRow className="hover:bg-transparent [&>td]:px-2.5 font-extrabold text-sm">
                                    <TableCell className="bg-slate-800 text-white py-4 w-[180px]">TOTAL GERAL</TableCell>
                                    <TableCell className="text-center py-4">{grandTotals.new_clients}</TableCell>
                                    <TableCell className="text-center py-4">{grandTotals.total_contacts}</TableCell>
                                    <TableCell className="text-center py-4">{grandTotals.effective_contacts}</TableCell>
                                    <TableCell className="text-center bg-slate-800/10 py-4 text-slate-800">{calculateRates(grandTotals).ceRate.toFixed(1)}%</TableCell>
                                    <TableCell className="text-center py-4">{grandTotals.scheduled_visits}</TableCell>
                                    <TableCell className="text-center bg-slate-800/10 py-4 text-slate-800">{calculateRates(grandTotals).agRate.toFixed(1)}%</TableCell>
                                    <TableCell className="text-center py-4">{grandTotals.awaiting_visits}</TableCell>
                                    <TableCell className="text-center py-4">{grandTotals.completed_visits}</TableCell>
                                    <TableCell className="text-center bg-slate-800/10 py-4 text-slate-800">{calculateRates(grandTotals).atRate.toFixed(1)}%</TableCell>
                                    <TableCell className="text-center py-4">{grandTotals.enrollments}</TableCell>
                                    <TableCell className="text-center bg-slate-800/10 py-4 text-slate-800">{calculateRates(grandTotals).maRate.toFixed(1)}%</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

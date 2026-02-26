import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export type DateRangeType = 'current_month' | 'last_month' | 'last_3_months' | 'custom';

interface DashboardDateFilterProps {
    onDateChange: (start: Date, end: Date) => void;
    defaultRange?: DateRangeType;
}

export function DashboardDateFilter({ onDateChange, defaultRange = 'current_month' }: DashboardDateFilterProps) {
    const [activeRange, setActiveRange] = useState<DateRangeType>(defaultRange);
    const [customRange, setCustomRange] = useState<{ from: Date | undefined, to: Date | undefined }>({
        from: undefined,
        to: undefined
    });
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    useEffect(() => {
        handlePredefinedRange(defaultRange);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlePredefinedRange = (range: DateRangeType) => {
        setActiveRange(range);
        const now = new Date();

        if (range === 'current_month') {
            onDateChange(startOfMonth(now), endOfMonth(now));
        } else if (range === 'last_month') {
            const lastMonth = subMonths(now, 1);
            onDateChange(startOfMonth(lastMonth), endOfMonth(lastMonth));
        } else if (range === 'last_3_months') {
            const threeMonthsAgo = subMonths(now, 3);
            onDateChange(startOfMonth(threeMonthsAgo), endOfMonth(now));
        }
    };

    const handleCustomDateSelect = () => {
        if (customRange.from && customRange.to) {
            setActiveRange('custom');
            onDateChange(startOfDay(customRange.from), endOfDay(customRange.to));
            setIsPopoverOpen(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Button
                variant={activeRange === 'current_month' ? 'default' : 'outline'}
                size="sm"
                className={activeRange === 'current_month' ? 'bg-[#ff7a00] hover:bg-[#ff7a00]/90 text-white' : ''}
                onClick={() => handlePredefinedRange('current_month')}
            >
                Mês Atual
            </Button>
            <Button
                variant={activeRange === 'last_month' ? 'default' : 'outline'}
                size="sm"
                className={activeRange === 'last_month' ? 'bg-[#ff7a00] hover:bg-[#ff7a00]/90 text-white' : ''}
                onClick={() => handlePredefinedRange('last_month')}
            >
                Mês Anterior
            </Button>
            <Button
                variant={activeRange === 'last_3_months' ? 'default' : 'outline'}
                size="sm"
                className={activeRange === 'last_3_months' ? 'bg-[#ff7a00] hover:bg-[#ff7a00]/90 text-white' : ''}
                onClick={() => handlePredefinedRange('last_3_months')}
            >
                3 Meses
            </Button>

            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant={activeRange === 'custom' ? 'default' : 'outline'}
                        size="sm"
                        className={`flex items-center gap-2 ${activeRange === 'custom' ? 'bg-[#ff7a00] hover:bg-[#ff7a00]/90 text-white' : ''}`}
                    >
                        <CalendarIcon className="h-4 w-4" />
                        Personalizado
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <div className="flex flex-col p-2">
                        <Calendar
                            mode="range"
                            selected={{ from: customRange.from, to: customRange.to }}
                            onSelect={(range: any) => {
                                setCustomRange({ from: range?.from, to: range?.to });
                            }}
                            locale={ptBR}
                            initialFocus
                            numberOfMonths={2}
                        />
                        <div className="flex justify-end p-2 border-t mt-2">
                            <Button
                                size="sm"
                                onClick={handleCustomDateSelect}
                                disabled={!customRange.from || !customRange.to}
                                className="bg-[#ff7a00] hover:bg-[#ff7a00]/90 text-white"
                            >
                                Aplicar
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}

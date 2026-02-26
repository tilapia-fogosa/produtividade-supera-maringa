import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export type AdvancedFilters = {
    dateFrom: Date | undefined;
    dateTo: Date | undefined;
    status: string;
    leadSource: string;
    ad: string;
    responsible: string;
};

interface AdvancedFiltersModalProps {
    isOpen: boolean;
    onClose: () => void;
    filters: AdvancedFilters;
    onFiltersChange: (filters: AdvancedFilters) => void;
    uniqueAds: string[];
    uniqueResponsibles: string[];
    uniqueLeadSources: string[];
}

export function AdvancedFiltersModal({
    isOpen,
    onClose,
    filters,
    onFiltersChange,
    uniqueAds,
    uniqueResponsibles,
    uniqueLeadSources
}: AdvancedFiltersModalProps) {
    const handleReset = () => {
        onFiltersChange({
            dateFrom: undefined,
            dateTo: undefined,
            status: 'Todos',
            leadSource: 'Todos',
            ad: 'Todos',
            responsible: 'Todos',
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[550px] p-4">
                <DialogHeader className="pb-2 border-b">
                    <DialogTitle className="text-lg">Filtros avançados</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                    <div className="space-y-1.5">
                        <Label>Período de cadastro</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !filters.dateFrom && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {filters.dateFrom ? format(filters.dateFrom, "dd/MM/yyyy") : <span>De</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={filters.dateFrom}
                                        onSelect={(date) => onFiltersChange({ ...filters, dateFrom: date })}
                                        initialFocus
                                        locale={ptBR}
                                    />
                                </PopoverContent>
                            </Popover>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !filters.dateTo && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {filters.dateTo ? format(filters.dateTo, "dd/MM/yyyy") : <span>Até</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={filters.dateTo}
                                        onSelect={(date) => onFiltersChange({ ...filters, dateTo: date })}
                                        initialFocus
                                        locale={ptBR}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label>Status</Label>
                            <Select value={filters.status} onValueChange={(val) => onFiltersChange({ ...filters, status: val })}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent position="popper" side="bottom" className="max-h-[220px] overflow-y-auto">
                                    <SelectItem value="Todos">Todos</SelectItem>
                                    <SelectItem value="novo-cadastro">Novo Cadastro</SelectItem>
                                    <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
                                    <SelectItem value="agendado">Agendado</SelectItem>
                                    <SelectItem value="visitou">Visitou</SelectItem>
                                    <SelectItem value="matriculado">Matriculado</SelectItem>
                                    <SelectItem value="nao_matriculado">Não Matriculado</SelectItem>
                                    <SelectItem value="inativo">Inativo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-1.5">
                            <Label>Origem do Lead</Label>
                            <Select value={filters.leadSource} onValueChange={(val) => onFiltersChange({ ...filters, leadSource: val })}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent position="popper" side="bottom" className="max-h-[220px] overflow-y-auto">
                                    <SelectItem value="Todos">Todos</SelectItem>
                                    {uniqueLeadSources.map(source => (
                                        <SelectItem key={source} value={source}>{source}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-1.5">
                            <Label>Anúncio</Label>
                            <Select value={filters.ad} onValueChange={(val) => onFiltersChange({ ...filters, ad: val })}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent position="popper" side="bottom" className="max-h-[220px] overflow-y-auto">
                                    <SelectItem value="Todos">Todos</SelectItem>
                                    {uniqueAds.map(ad => (
                                        <SelectItem key={ad || 'empty'} value={ad || 'vazio'}>{ad || 'Sem Anúncio'}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-1.5">
                            <Label>Responsável</Label>
                            <Select value={filters.responsible} onValueChange={(val) => onFiltersChange({ ...filters, responsible: val })}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent position="popper" side="bottom" className="max-h-[220px] overflow-y-auto">
                                    <SelectItem value="Todos">Todos</SelectItem>
                                    {uniqueResponsibles.map(resp => (
                                        <SelectItem key={resp || 'empty'} value={resp || 'vazio'}>{resp || 'Sem Responsável'}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                <DialogFooter className="flex justify-between sm:justify-between w-full pt-2 mt-2 border-t">
                    <Button variant="ghost" className="text-slate-500 h-9" onClick={handleReset}>Limpar Filtros</Button>
                    <Button onClick={onClose} className="bg-[#f37c22] hover:bg-[#d46816] text-white h-9">Aplicar Filtros</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Formulário de Horário de Funcionamento da Unidade
 * 
 * Permite configurar horário de abertura e fechamento para cada dia da semana.
 * Salva diretamente na coluna `horario_funcionamento` da tabela `units`.
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface DiaHorario {
    aberto: boolean;
    inicio: string;
    fim: string;
}

interface HorarioFuncionamento {
    segunda: DiaHorario;
    terca: DiaHorario;
    quarta: DiaHorario;
    quinta: DiaHorario;
    sexta: DiaHorario;
    sabado: DiaHorario;
    domingo: DiaHorario;
}

const DIAS_SEMANA: { key: keyof HorarioFuncionamento; label: string }[] = [
    { key: "segunda", label: "Segunda-feira" },
    { key: "terca", label: "Terça-feira" },
    { key: "quarta", label: "Quarta-feira" },
    { key: "quinta", label: "Quinta-feira" },
    { key: "sexta", label: "Sexta-feira" },
    { key: "sabado", label: "Sábado" },
    { key: "domingo", label: "Domingo" },
];

const DEFAULT_HORARIO: HorarioFuncionamento = {
    segunda: { aberto: true, inicio: "08:00", fim: "18:00" },
    terca: { aberto: true, inicio: "08:00", fim: "18:00" },
    quarta: { aberto: true, inicio: "08:00", fim: "18:00" },
    quinta: { aberto: true, inicio: "08:00", fim: "18:00" },
    sexta: { aberto: true, inicio: "08:00", fim: "18:00" },
    sabado: { aberto: true, inicio: "08:00", fim: "12:00" },
    domingo: { aberto: false, inicio: "", fim: "" },
};

export function HorarioFuncionamentoForm() {
    const { activeUnit } = useActiveUnit();
    const queryClient = useQueryClient();
    const [horario, setHorario] = useState<HorarioFuncionamento>(DEFAULT_HORARIO);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Buscar horário atual da unidade
    const { data: unitData, isLoading } = useQuery({
        queryKey: ["unit-horario", activeUnit?.id],
        queryFn: async () => {
            if (!activeUnit?.id) return null;
            const { data, error } = await supabase
                .from("units")
                .select("horario_funcionamento")
                .eq("id", activeUnit.id)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!activeUnit?.id,
    });

    // Inicializar formulário com dados do banco
    useEffect(() => {
        if (unitData?.horario_funcionamento) {
            setHorario(unitData.horario_funcionamento as unknown as HorarioFuncionamento);
            setHasChanges(false);
        }
    }, [unitData]);

    const handleToggleDia = (dia: keyof HorarioFuncionamento) => {
        setHorario((prev) => ({
            ...prev,
            [dia]: { ...prev[dia], aberto: !prev[dia].aberto },
        }));
        setHasChanges(true);
    };

    const handleTimeChange = (dia: keyof HorarioFuncionamento, campo: "inicio" | "fim", valor: string) => {
        setHorario((prev) => ({
            ...prev,
            [dia]: { ...prev[dia], [campo]: valor },
        }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!activeUnit?.id) return;

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from("units")
                .update({ horario_funcionamento: horario as any })
                .eq("id", activeUnit.id);

            if (error) throw error;

            queryClient.invalidateQueries({ queryKey: ["unit-horario", activeUnit.id] });
            setHasChanges(false);
            toast.success("Horário de funcionamento salvo com sucesso!");
        } catch (error: any) {
            console.error("Erro ao salvar horário:", error);
            toast.error("Erro ao salvar horário de funcionamento");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <CardTitle className="text-base">Horário de Funcionamento</CardTitle>
                            <CardDescription>
                                Configure o horário de funcionamento da unidade para cada dia da semana
                            </CardDescription>
                        </div>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || !hasChanges}
                        size="sm"
                    >
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        Salvar
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {DIAS_SEMANA.map(({ key, label }) => (
                        <div
                            key={key}
                            className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${horario[key].aberto
                                    ? "bg-background border-border"
                                    : "bg-muted/50 border-muted"
                                }`}
                        >
                            {/* Dia da semana + toggle */}
                            <div className="flex items-center gap-3 min-w-[180px]">
                                <Switch
                                    checked={horario[key].aberto}
                                    onCheckedChange={() => handleToggleDia(key)}
                                />
                                <Label className={`text-sm font-medium ${!horario[key].aberto ? "text-muted-foreground" : ""}`}>
                                    {label}
                                </Label>
                            </div>

                            {/* Horários */}
                            {horario[key].aberto ? (
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="time"
                                        value={horario[key].inicio}
                                        onChange={(e) => handleTimeChange(key, "inicio", e.target.value)}
                                        className="w-[120px] h-8 text-sm"
                                    />
                                    <span className="text-sm text-muted-foreground">até</span>
                                    <Input
                                        type="time"
                                        value={horario[key].fim}
                                        onChange={(e) => handleTimeChange(key, "fim", e.target.value)}
                                        className="w-[120px] h-8 text-sm"
                                    />
                                </div>
                            ) : (
                                <span className="text-sm text-muted-foreground italic">Fechado</span>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

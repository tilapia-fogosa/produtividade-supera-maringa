import { WidgetFunilDeConversao } from "./indicadores-comerciais/components/WidgetFunilDeConversao";
import { WidgetTotaisUsuario } from "./indicadores-comerciais/components/WidgetTotaisUsuario";
import { WidgetTotaisOrigem } from "./indicadores-comerciais/components/WidgetTotaisOrigem";
import { WidgetTotaisUnidade } from "./indicadores-comerciais/components/WidgetTotaisUnidade";

export default function IndicadoresComerciais() {
    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 bg-slate-50 min-h-screen">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Indicadores Comerciais</h1>
                <p className="text-muted-foreground">
                    Visão estratégica do funil de vendas, origens de lead e performance da equipe.
                </p>
            </div>

            <div className="grid gap-6">
                <WidgetFunilDeConversao />
                <WidgetTotaisUsuario />
                <WidgetTotaisOrigem />
                <WidgetTotaisUnidade />
            </div>
        </div>
    );
}

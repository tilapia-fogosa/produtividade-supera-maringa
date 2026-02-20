import { useComissaoMetas } from "@/hooks/use-comissao-metas";

interface ComissaoHeaderProps {
  mes: number;
  ano: number;
  totalMatriculas: number;
  totalFaturamento: number;
}

const CircularGauge = ({
  label,
  realizado,
  meta,
  formatValue,
}: {
  label: string;
  realizado: number;
  meta: number;
  formatValue: (v: number) => string;
}) => {
  const percent = meta > 0 ? Math.min((realizado / meta) * 100, 100) : 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const falta = Math.max(meta - realizado, 0);

  const getColor = () => {
    if (percent >= 100) return "hsl(var(--primary))";
    if (percent >= 70) return "hsl(45, 93%, 47%)";
    return "hsl(0, 72%, 51%)";
  };

  return (
    <div className="flex items-center gap-5 bg-card border border-border rounded-xl p-5 flex-1 min-w-[280px]">
      <div className="relative w-[130px] h-[130px] flex-shrink-0">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="10"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-foreground">
            {percent.toFixed(0)}%
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <div className="flex flex-col gap-0.5 text-sm">
          <span className="text-muted-foreground">
            Meta: <span className="font-medium text-foreground">{formatValue(meta)}</span>
          </span>
          <span className="text-muted-foreground">
            Realizado: <span className="font-medium text-foreground">{formatValue(realizado)}</span>
          </span>
          <span className="text-muted-foreground">
            Faltam: <span className="font-medium text-foreground">{formatValue(falta)}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const ComissaoHeader = ({ mes, ano, totalMatriculas, totalFaturamento }: ComissaoHeaderProps) => {
  const { metas } = useComissaoMetas();

  const metaDoMes = metas.find((m) => m.mes === mes && m.ano === ano);
  const metaFaturamento = metaDoMes?.valor_meta ?? 0;
  const metaMatriculas = metaDoMes?.numero_matriculas ?? 0;

  return (
    <div className="flex gap-4 flex-wrap mb-4">
      <CircularGauge
        label="Meta de Matrículas"
        realizado={totalMatriculas}
        meta={metaMatriculas}
        formatValue={(v) => String(v)}
      />
      <CircularGauge
        label="Meta de Faturamento"
        realizado={totalFaturamento}
        meta={metaFaturamento}
        formatValue={formatCurrency}
      />
    </div>
  );
};

export default ComissaoHeader;

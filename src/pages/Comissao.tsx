import { useState } from "react";
import { useComissoes } from "@/hooks/use-comissoes";
import { useComissaoConfig, evaluateFormula } from "@/hooks/use-comissao-config";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import FormulaBuilder from "@/components/comissao/FormulaBuilder";
import MetasTab from "@/components/comissao/MetasTab";
import ComissaoHeader from "@/components/comissao/ComissaoHeader";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const ANOS = Array.from({ length: 5 }, (_, i) => currentYear - i);

const formatCurrency = (value: number | null) => {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const Comissao = () => {
  const { profile } = useAuth();
  const [mes, setMes] = useState(currentDate.getMonth());
  const [ano, setAno] = useState(currentYear);
  const { data: comissoes, isLoading } = useComissoes(mes, ano);
  const { config } = useComissaoConfig();

  const canSeeConfig = profile?.role === "franqueado" || profile?.role === "admin";
  const canSeeMetas = profile?.role === "franqueado" || profile?.role === "admin";
  const formulaBlocks = config?.formula_json || [];
  const hasFormula = formulaBlocks.length > 0;

  const calcContrato = (item: { valor_mensalidade: number | null; valor_material: number | null; valor_matricula: number | null }) => {
    return 18 * (item.valor_mensalidade || 0) + (item.valor_material || 0) + (item.valor_matricula || 0);
  };

  const calcComissao = (item: { valor_material: number | null; valor_mensalidade: number | null; valor_matricula: number | null }) => {
    if (!hasFormula) return null;
    return evaluateFormula(formulaBlocks, {
      material: item.valor_material || 0,
      mensalidade: item.valor_mensalidade || 0,
      matricula: item.valor_matricula || 0,
    });
  };

  const totalMensalidade = comissoes?.reduce((sum, c) => sum + (c.valor_mensalidade || 0), 0) ?? 0;
  const totalMaterial = comissoes?.reduce((sum, c) => sum + (c.valor_material || 0), 0) ?? 0;
  const totalMatricula = comissoes?.reduce((sum, c) => sum + (c.valor_matricula || 0), 0) ?? 0;
  const totalContrato = comissoes?.reduce((sum, c) => sum + calcContrato(c), 0) ?? 0;
  const totalComissao = hasFormula
    ? comissoes?.reduce((sum, c) => sum + (calcComissao(c) || 0), 0) ?? 0
    : null;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-foreground mb-4">Comissão</h1>

      <Tabs defaultValue="comissoes">
        <TabsList>
          <TabsTrigger value="comissoes">Comissões</TabsTrigger>
          {canSeeConfig && <TabsTrigger value="configuracoes">Configurações</TabsTrigger>}
          {canSeeMetas && <TabsTrigger value="metas">Metas</TabsTrigger>}
        </TabsList>

        <TabsContent value="comissoes">
          {/* Filtros */}
          <div className="flex gap-3 my-4">
            <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MESES.map((nome, i) => (
                  <SelectItem key={i} value={String(i)}>{nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ANOS.map((a) => (
                  <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ComissaoHeader
            mes={mes}
            ano={ano}
            totalMatriculas={comissoes?.filter(c => c.status === "Concluído").length ?? 0}
            totalFaturamento={totalContrato}
          />

          {/* Tabela */}
          {isLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : !comissoes?.length ? (
            <p className="text-muted-foreground">Nenhuma matrícula encontrada no período.</p>
          ) : (
            <Table className="table-auto">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[20%]">Nome do Aluno</TableHead>
                  <TableHead className="w-[14%]">Vendedor</TableHead>
                  <TableHead className="w-[11%] text-right">Mensalidade</TableHead>
                  <TableHead className="w-[11%] text-right">Material</TableHead>
                  <TableHead className="w-[11%] text-right">Matrícula</TableHead>
                  <TableHead className="w-[11%] text-right">Contrato</TableHead>
                  <TableHead className="w-[11%] text-right">Comissão</TableHead>
                  <TableHead className="w-[11%]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comissoes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.aluno_nome}</TableCell>
                    <TableCell>{c.vendedor_nome}</TableCell>
                    <TableCell className="text-right">{formatCurrency(c.valor_mensalidade)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(c.valor_material)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(c.valor_matricula)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(calcContrato(c))}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {hasFormula ? formatCurrency(calcComissao(c)) : "—"}
                    </TableCell>
                    <TableCell>
                      <span className={c.status === "Concluído" ? "text-green-600 font-medium" : c.status === "Pendente" ? "text-red-500 font-medium" : ""}>
                        {c.status || "—"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2} className="font-bold">Total</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(totalMensalidade)}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(totalMaterial)}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(totalMatricula)}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(totalContrato)}</TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    {hasFormula ? formatCurrency(totalComissao) : "—"}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </TabsContent>

        {canSeeConfig && (
          <TabsContent value="configuracoes">
            <div className="mt-4 max-w-2xl">
              <FormulaBuilder />
            </div>
          </TabsContent>
        )}

        {canSeeMetas && (
          <TabsContent value="metas">
            <MetasTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Comissao;

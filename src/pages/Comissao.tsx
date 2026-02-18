import { useState } from "react";
import { useComissoes } from "@/hooks/use-comissoes";
import { useComissaoConfig, evaluateFormula } from "@/hooks/use-comissao-config";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import FormulaBuilder from "@/components/comissao/FormulaBuilder";

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
  const formulaBlocks = config?.formula_json || [];
  const hasFormula = formulaBlocks.length > 0;

  const calcComissao = (item: typeof comissoes extends (infer T)[] | undefined ? T : never) => {
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

          {/* Tabela */}
          {isLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : !comissoes?.length ? (
            <p className="text-muted-foreground">Nenhuma matrícula encontrada no período.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[22%]">Nome do Aluno</TableHead>
                  <TableHead className="w-[16%]">Vendedor</TableHead>
                  <TableHead className="w-[13%] text-right">Mensalidade</TableHead>
                  <TableHead className="w-[13%] text-right">Material</TableHead>
                  <TableHead className="w-[13%] text-right">Matrícula</TableHead>
                  {hasFormula && <TableHead className="w-[13%] text-right">Comissão</TableHead>}
                  <TableHead className="w-[10%]">Status</TableHead>
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
                    {hasFormula && (
                      <TableCell className="text-right font-semibold text-primary">
                        {formatCurrency(calcComissao(c))}
                      </TableCell>
                    )}
                    <TableCell>{c.status || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2} className="font-bold">Total</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(totalMensalidade)}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(totalMaterial)}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(totalMatricula)}</TableCell>
                  {hasFormula && (
                    <TableCell className="text-right font-bold text-primary">
                      {formatCurrency(totalComissao)}
                    </TableCell>
                  )}
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
      </Tabs>
    </div>
  );
};

export default Comissao;

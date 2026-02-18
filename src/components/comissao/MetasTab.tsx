import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { useComissaoMetas, MESES } from "@/hooks/use-comissao-metas";

const currentYear = new Date().getFullYear();
const ANOS = Array.from({ length: 5 }, (_, i) => currentYear - i);

const formatCurrency = (value: number) => {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const MetasTab = () => {
  const { metas, isLoading, addMeta, deleteMeta } = useComissaoMetas();
  const [open, setOpen] = useState(false);
  const [mes, setMes] = useState(new Date().getMonth());
  const [ano, setAno] = useState(currentYear);
  const [valor, setValor] = useState("");

  const handleAdd = () => {
    const valorNum = parseFloat(valor.replace(",", "."));
    if (isNaN(valorNum) || valorNum <= 0) return;
    addMeta.mutate({ mes, ano, valor_meta: valorNum }, {
      onSuccess: () => {
        setOpen(false);
        setValor("");
      },
    });
  };

  if (isLoading) {
    return <p className="text-muted-foreground mt-4">Carregando...</p>;
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Metas por Mês</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Meta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Meta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground mb-1 block">Mês</label>
                  <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MESES.map((nome, i) => (
                        <SelectItem key={i} value={String(i)}>{nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-[120px]">
                  <label className="text-sm font-medium text-foreground mb-1 block">Ano</label>
                  <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ANOS.map((a) => (
                        <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Valor da Meta (soma dos contratos)
                </label>
                <Input
                  type="text"
                  placeholder="Ex: 50000"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                />
              </div>
              <Button onClick={handleAdd} disabled={addMeta.isPending} className="w-full">
                {addMeta.isPending ? "Salvando..." : "Salvar Meta"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {metas.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma meta cadastrada.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mês</TableHead>
              <TableHead>Ano</TableHead>
              <TableHead className="text-right">Valor da Meta</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {metas.map((meta) => (
              <TableRow key={meta.id}>
                <TableCell>{MESES[meta.mes]}</TableCell>
                <TableCell>{meta.ano}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(meta.valor_meta)}</TableCell>
                <TableCell>
                  <button
                    onClick={() => deleteMeta.mutate(meta.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default MetasTab;

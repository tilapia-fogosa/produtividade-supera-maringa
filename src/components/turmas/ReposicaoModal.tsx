import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { usePessoasReposicao } from "@/hooks/use-alunos-reposicao";
import { useReposicoes, calcularDatasValidas } from "@/hooks/use-reposicoes";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
interface Turma {
  id: string;
  nome: string;
  dia_semana: string;
  unit_id: string;
}
interface ReposicaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  turma: Turma;
}
const ReposicaoModal: React.FC<ReposicaoModalProps> = ({
  isOpen,
  onClose,
  turma
}) => {
  const isMobile = useIsMobile();
  const { user, profile } = useAuth();
  const { data: pessoas = [], isLoading: loadingPessoas } = usePessoasReposicao(null);
  const {
    criarReposicao
  } = useReposicoes();
  const [alunoSelecionado, setAlunoSelecionado] = useState<string>("");
  const [dataFalta, setDataFalta] = useState<Date | undefined>();
  const [dataSelecionada, setDataSelecionada] = useState<Date | undefined>();
  const [observacoes, setObservacoes] = useState<string>("");

  // Calcular datas válidas baseadas no dia da semana da turma
  const datasValidas = calcularDatasValidas(turma.dia_semana);

  const handleSubmit = async () => {
    if (!alunoSelecionado || !user?.id || !dataSelecionada) {
      return;
    }

    try {
      await criarReposicao.mutateAsync({
        aluno_id: alunoSelecionado,
        turma_id: turma.id,
        data_reposicao: format(dataSelecionada, 'yyyy-MM-dd'),
        data_falta: dataFalta ? format(dataFalta, 'yyyy-MM-dd') : undefined,
        responsavel_id: user.id,
        responsavel_tipo: 'usuario',
        nome_responsavel: profile?.full_name || user.email || '',
        observacoes: observacoes || undefined,
        unit_id: turma.unit_id,
        funcionario_registro_id: user.id
      });

      // Resetar form
      setAlunoSelecionado("");
      setDataFalta(undefined);
      setDataSelecionada(undefined);
      setObservacoes("");
      onClose();
    } catch (error) {
      console.error('Erro ao salvar reposição:', error);
    }
  };
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("max-w-2xl max-h-[90vh] overflow-y-auto", isMobile && "max-w-[95vw]")}>
        <DialogHeader>
          <DialogTitle className="text-azul-500">
            Registrar Reposição - {turma.nome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Seleção da Pessoa */}
          <div className="space-y-2">
            <Label htmlFor="pessoa">Pessoa (Aluno ou Funcionário) *</Label>
            <Select value={alunoSelecionado} onValueChange={setAlunoSelecionado} disabled={loadingPessoas}>
              <SelectTrigger>
                <SelectValue placeholder={loadingPessoas ? "Carregando..." : "Selecione a pessoa"} />
              </SelectTrigger>
              <SelectContent>
                {pessoas.map(pessoa => <SelectItem key={pessoa.id} value={pessoa.id}>
                    {pessoa.nome} ({pessoa.tipo === 'aluno' ? 'Aluno' : 'Funcionário'})
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Data da Falta */}
          <div className="space-y-2">
            <Label>Data da Falta (opcional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dataFalta && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataFalta ? format(dataFalta, "PPP", {
                  locale: ptBR
                }) : "Selecione a data da falta"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar 
                  mode="single" 
                  selected={dataFalta} 
                  onSelect={setDataFalta} 
                  initialFocus 
                  locale={ptBR} 
                  className={cn("p-3 pointer-events-auto", isMobile && "text-sm")} 
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Seleção da Data */}
          <div className="space-y-2">
            <Label>Data da Reposição *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dataSelecionada && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataSelecionada ? format(dataSelecionada, "PPP", {
                  locale: ptBR
                }) : "Selecione a data da reposição"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dataSelecionada} onSelect={setDataSelecionada} disabled={date => !datasValidas.some(d => format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))} modifiers={{
                available: datasValidas,
                selected: dataSelecionada ? [dataSelecionada] : undefined
              }} modifiersStyles={{
                available: {
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))'
                },
                selected: {
                  backgroundColor: 'hsl(var(--secondary))',
                  color: 'hsl(var(--secondary-foreground))',
                  border: '2px solid hsl(var(--secondary))',
                  fontWeight: '600'
                }
              }} locale={ptBR} className={cn("p-3 pointer-events-auto", isMobile && "text-sm")} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea id="observacoes" value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Observações sobre a reposição (opcional)" className="min-h-[60px]" />
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={criarReposicao.isPending}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="flex-1" disabled={!alunoSelecionado || !user?.id || !dataSelecionada || criarReposicao.isPending}>
              {criarReposicao.isPending ? "Salvando..." : "Salvar Reposição"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};
export default ReposicaoModal;
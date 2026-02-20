import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useResponsaveis } from "@/hooks/use-responsaveis";

interface NaoTemTamanhoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dados: {
    responsavel_id: string;
    responsavel_tipo: string;
    responsavel_nome: string;
    data_informacao: Date;
    observacoes: string;
  }) => Promise<void>;
  alunoNome: string;
}

export function NaoTemTamanhoModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  alunoNome 
}: NaoTemTamanhoModalProps) {
  const [responsavelId, setResponsavelId] = useState<string>("");
  const [dataInformacao, setDataInformacao] = useState<Date>(new Date());
  const [observacoes, setObservacoes] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { responsaveis, isLoading: isLoadingResponsaveis } = useResponsaveis();

  const responsavelSelecionado = responsaveis.find(r => r.id === responsavelId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação
    const newErrors: { [key: string]: string } = {};
    
    if (!responsavelId) {
      newErrors.responsavel = "Responsável é obrigatório";
    }
    
    if (!observacoes.trim()) {
      newErrors.observacoes = "Observações são obrigatórias";
    } else if (observacoes.length > 500) {
      newErrors.observacoes = "Observações não podem ter mais de 500 caracteres";
    }

    if (dataInformacao > new Date()) {
      newErrors.data = "A data não pode ser futura";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!responsavelSelecionado) return;

    setIsLoading(true);
    try {
      await onConfirm({
        responsavel_id: responsavelId,
        responsavel_tipo: 'usuario',
        responsavel_nome: responsavelSelecionado.nome,
        data_informacao: dataInformacao,
        observacoes: observacoes.trim(),
      });
      
      // Resetar form
      setResponsavelId("");
      setObservacoes("");
      setDataInformacao(new Date());
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setResponsavelId("");
    setObservacoes("");
    setDataInformacao(new Date());
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Registrar - Não Tem Tamanho Disponível</DialogTitle>
          <DialogDescription>
            Registrar informação para o aluno: <strong>{alunoNome}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Responsável */}
          <div className="space-y-2">
            <Label htmlFor="responsavel">
              Responsável pela Informação <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={responsavelId} 
              onValueChange={setResponsavelId}
              disabled={isLoadingResponsaveis}
            >
              <SelectTrigger className={cn(errors.responsavel && "border-red-500")}>
                <SelectValue placeholder={isLoadingResponsaveis ? "Carregando..." : "Selecione o responsável"} />
              </SelectTrigger>
              <SelectContent>
                {responsaveis.map((responsavel) => (
                  <SelectItem key={responsavel.id} value={responsavel.id}>
                    {responsavel.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.responsavel && (
              <p className="text-sm text-red-500">{errors.responsavel}</p>
            )}
          </div>

          {/* Data da Informação */}
          <div className="space-y-2">
            <Label htmlFor="data">
              Data da Informação <span className="text-red-500">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataInformacao && "text-muted-foreground",
                    errors.data && "border-red-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataInformacao ? (
                    format(dataInformacao, "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    <span>Selecione a data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataInformacao}
                  onSelect={(date) => date && setDataInformacao(date)}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {errors.data && (
              <p className="text-sm text-red-500">{errors.data}</p>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">
              Observações <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Descreva o motivo pelo qual não há tamanho disponível..."
              className={cn(
                "min-h-[100px] resize-none",
                errors.observacoes && "border-red-500"
              )}
              maxLength={500}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{observacoes.length}/500 caracteres</span>
              {errors.observacoes && (
                <span className="text-red-500">{errors.observacoes}</span>
              )}
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || isLoadingResponsaveis}
            >
              {isLoading ? "Salvando..." : "Confirmar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
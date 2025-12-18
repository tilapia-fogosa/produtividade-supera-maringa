import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAulasExperimentais } from "@/hooks/use-aulas-experimentais";
import { useAuth } from "@/contexts/AuthContext";

interface AulaExperimentalModalProps {
  isOpen: boolean;
  onClose: () => void;
  turmaId: string;
  turmaNome: string;
  diaSemana: string;
  unitId: string;
}

const AulaExperimentalModal: React.FC<AulaExperimentalModalProps> = ({
  isOpen,
  onClose,
  turmaId,
  turmaNome,
  diaSemana,
  unitId
}) => {
  const [clienteNome, setClienteNome] = useState('');
  const [dataAulaExperimental, setDataAulaExperimental] = useState<Date>();
  const [descricaoCliente, setDescricaoCliente] = useState('');

  const { criarAulaExperimental, calcularDatasValidas } = useAulasExperimentais();
  const { user, profile } = useAuth();

  const datasValidas = calcularDatasValidas(diaSemana);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clienteNome || !user?.id || !dataAulaExperimental || !descricaoCliente) {
      return;
    }

    criarAulaExperimental.mutate({
      cliente_nome: clienteNome,
      turma_id: turmaId,
      data_aula_experimental: format(dataAulaExperimental, 'yyyy-MM-dd'),
      responsavel_id: user.id,
      responsavel_tipo: 'usuario',
      responsavel_nome: profile?.full_name || user.email || '',
      descricao_cliente: descricaoCliente || undefined,
      unit_id: unitId,
      funcionario_registro_id: user.id,
    }, {
      onSuccess: () => {
        handleClose();
      }
    });
  };

  const handleClose = () => {
    setClienteNome('');
    setDataAulaExperimental(undefined);
    setDescricaoCliente('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Lançar Aula Experimental - {turmaNome}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cliente-nome">Nome do Cliente</Label>
            <Input
              id="cliente-nome"
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
              placeholder="Digite o nome do cliente"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Data da Aula Experimental</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataAulaExperimental && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataAulaExperimental ? format(dataAulaExperimental, "PPP", { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataAulaExperimental}
                  onSelect={setDataAulaExperimental}
                  disabled={(date) => {
                    return !datasValidas.some(dataValida => 
                      format(dataValida, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                    );
                  }}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao-cliente">Descrição Detalhada do Cliente *</Label>
            <Textarea
              id="descricao-cliente"
              value={descricaoCliente}
              onChange={(e) => setDescricaoCliente(e.target.value)}
              placeholder="Digite informações adicionais sobre o cliente"
              rows={3}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={criarAulaExperimental.isPending}
            >
              {criarAulaExperimental.isPending ? "Salvando..." : "Salvar Aula Experimental"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AulaExperimentalModal;
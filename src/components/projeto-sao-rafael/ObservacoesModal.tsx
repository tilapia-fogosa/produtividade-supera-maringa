
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2, Pen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ObservacoesModalProps {
  textoGeral: string;
  mesAno: string;
  onSalvar: (texto: string) => Promise<boolean>;
}

const ObservacoesModal: React.FC<ObservacoesModalProps> = ({
  textoGeral,
  mesAno,
  onSalvar
}) => {
  const [open, setOpen] = useState(false);
  const [textoTemp, setTextoTemp] = useState(textoGeral);
  const [salvando, setSalvando] = useState(false);
  const { toast } = useToast();

  // Sincronizar texto temporário quando o modal abrir
  React.useEffect(() => {
    if (open) {
      setTextoTemp(textoGeral);
    }
  }, [open, textoGeral]);

  const formatarMesAno = (mesAno: string) => {
    const [ano, mes] = mesAno.split('-');
    const data = new Date(parseInt(ano), parseInt(mes) - 1);
    return data.toLocaleDateString('pt-BR', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const handleSalvar = async () => {
    setSalvando(true);
    try {
      const sucesso = await onSalvar(textoTemp);
      if (sucesso) {
        toast({
          title: "Sucesso",
          description: "Observações gerais salvas com sucesso!",
        });
        setOpen(false);
      } else {
        toast({
          title: "Erro",
          description: "Erro ao salvar as observações. Tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="text-azul-500 border-orange-200 hover:bg-orange-50"
        >
          <Pen className="mr-2 h-4 w-4" />
          Editar Observações
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-azul-500">
            Observações Gerais - {formatarMesAno(mesAno)}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Textarea
            value={textoTemp}
            onChange={(e) => setTextoTemp(e.target.value)}
            placeholder="Digite aqui suas observações gerais sobre o Projeto São Rafael para este mês..."
            className="min-h-[200px]"
          />
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSalvar}
              disabled={salvando}
              className="bg-azul-500 hover:bg-azul-600 text-white"
            >
              {salvando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Observações
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ObservacoesModal;

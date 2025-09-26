import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  alunoId: string;
  alunoNome: string;
  onSuccess: () => void;
}

export default function CamisetaModal({ isOpen, onClose, alunoId, alunoNome, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [tamanho, setTamanho] = useState('');
  const [dataEntrega, setDataEntrega] = useState(new Date().toISOString().split('T')[0]);
  const [responsavelId, setResponsavelId] = useState('');

  const handleSubmit = async () => {
    if (!tamanho || !responsavelId) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      await supabase.from('camisetas').upsert({
        aluno_id: alunoId,
        camiseta_entregue: true,
        tamanho_camiseta: tamanho,
        data_entrega: new Date(dataEntrega).toISOString()
      }, { onConflict: 'aluno_id' });

      toast({
        title: "Sucesso",
        description: "Entrega registrada!",
      });

      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao registrar.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Entrega</DialogTitle>
          <p>Aluno: <strong>{alunoNome}</strong></p>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div>
            <Label>Tamanho *</Label>
            <Select value={tamanho} onValueChange={setTamanho}>
              <SelectTrigger>
                <SelectValue placeholder="Tamanho" />
              </SelectTrigger>
              <SelectContent>
                {['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG'].map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Data *</Label>
            <Input
              type="date"
              value={dataEntrega}
              onChange={(e) => setDataEntrega(e.target.value)}
            />
          </div>

          <div>
            <Label>Responsável *</Label>
            <Input
              placeholder="Nome do responsável"
              value={responsavelId}
              onChange={(e) => setResponsavelId(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
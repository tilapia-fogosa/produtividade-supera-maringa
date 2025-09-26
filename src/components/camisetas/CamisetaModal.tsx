import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  alunoId: string;
  alunoNome: string;
  onSuccess: () => void;
  modalType?: 'entrega' | 'nao_tem_tamanho';
}

export default function CamisetaModal({ isOpen, onClose, alunoId, alunoNome, onSuccess, modalType = 'entrega' }: Props) {
  const [loading, setLoading] = useState(false);
  const [tamanho, setTamanho] = useState('');
  const [dataEntrega, setDataEntrega] = useState(new Date().toISOString().split('T')[0]);
  const [responsavelId, setResponsavelId] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const handleSubmit = async () => {
    if (modalType === 'entrega') {
      if (!tamanho || !responsavelId) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos.",
          variant: "destructive"
        });
        return;
      }
    } else if (modalType === 'nao_tem_tamanho') {
      if (!observacoes.trim()) {
        toast({
          title: "Erro",
          description: "Preencha o campo de observações.",
          variant: "destructive"
        });
        return;
      }
    }
    
    setLoading(true);
    try {
      if (modalType === 'entrega') {
        // Encontrar o responsável selecionado (para futuras melhorias)
        
        await supabase.from('camisetas').upsert({
          aluno_id: alunoId,
          camiseta_entregue: true,
          nao_tem_tamanho: false,
          tamanho_camiseta: tamanho,
          data_entrega: new Date(dataEntrega).toISOString(),
          responsavel_entrega_nome: responsavelId, // Por enquanto só o nome
          observacoes: observacoes.trim() || null
        }, { onConflict: 'aluno_id' });
      } else {
        await supabase.from('camisetas').upsert({
          aluno_id: alunoId,
          camiseta_entregue: false,
          nao_tem_tamanho: true,
          observacoes: observacoes.trim()
        }, { onConflict: 'aluno_id' });
      }

      toast({
        title: "Sucesso",
        description: modalType === 'entrega' ? "Entrega registrada!" : "Registro salvo!",
      });

      // Limpar campos
      setTamanho('');
      setResponsavelId('');
      setObservacoes('');
      
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
          <DialogTitle>
            {modalType === 'entrega' ? 'Registrar Entrega' : 'Não Tem Tamanho'}
          </DialogTitle>
          <p>Aluno: <strong>{alunoNome}</strong></p>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {modalType === 'entrega' && (
            <>
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
                  placeholder="Nome do responsável (professor ou funcionário)"
                  value={responsavelId}
                  onChange={(e) => setResponsavelId(e.target.value)}
                />
              </div>
            </>
          )}

          <div>
            <Label>
              Observações {modalType === 'nao_tem_tamanho' ? '*' : '(opcional)'}
            </Label>
            <Textarea
              placeholder={
                modalType === 'nao_tem_tamanho' 
                  ? "Descreva o motivo de não ter tamanho disponível..."
                  : "Observações adicionais (opcional)..."
              }
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {modalType === 'entrega' ? 'Registrar' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
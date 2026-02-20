import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BookOpen, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { formatDateSaoPaulo, toUtcFromSaoPauloDate } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";

interface RecolherApostilaUnicaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pessoaId: string;
  pessoaNome: string;
  pessoaOrigem: 'aluno' | 'funcionario';
  onSuccess?: () => void;
}

export const RecolherApostilaUnicaModal = ({ 
  open, 
  onOpenChange, 
  pessoaId, 
  pessoaNome, 
  pessoaOrigem,
  onSuccess 
}: RecolherApostilaUnicaModalProps) => {
  const [dataRecolhimento, setDataRecolhimento] = useState<string>(
    formatDateSaoPaulo(new Date(), 'yyyy-MM-dd')
  );
  const [apostilaSelecionada, setApostilaSelecionada] = useState<string>('');
  const [apostilasAH, setApostilasAH] = useState<string[]>([]);
  const [loadingApostilas, setLoadingApostilas] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { userId, userName, isLoading: loadingUser, isAuthenticated } = useCurrentUser();
  const queryClient = useQueryClient();

  // Carregar apostilas de AH do banco de dados
  useEffect(() => {
    const carregarApostilasAH = async () => {
      try {
        setLoadingApostilas(true);
        const { data, error } = await supabase
          .from('apostilas_ah')
          .select('nome')
          .order('nome');

        if (error) {
          console.error('Erro ao carregar apostilas AH:', error);
          return;
        }

        if (data) {
          setApostilasAH(data.map(a => a.nome));
        }
      } catch (err) {
        console.error('Erro ao carregar apostilas AH:', err);
      } finally {
        setLoadingApostilas(false);
      }
    };

    if (open) {
      carregarApostilasAH();
      setDataRecolhimento(formatDateSaoPaulo(new Date(), 'yyyy-MM-dd'));
      setApostilaSelecionada('');
    }
  }, [open]);

  const handleConfirmar = async () => {
    if (!userId || !userName) {
      return;
    }

    if (!dataRecolhimento || !apostilaSelecionada) {
      return;
    }

    setIsSubmitting(true);

    try {
      const registro = {
        pessoa_id: pessoaId,
        apostila: apostilaSelecionada,
        responsavel_id: userId,
        funcionario_registro_id: userId,
        created_at: toUtcFromSaoPauloDate(dataRecolhimento),
        data_recolhida: dataRecolhimento,
      };

      const { error } = await supabase
        .from('ah_recolhidas')
        .insert(registro);

      if (error) throw error;

      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ["apostilas-recolhidas"] });
      queryClient.invalidateQueries({ queryKey: ["pessoas-com-recolhimento-aberto"] });
      queryClient.invalidateQueries({ queryKey: ["proximas-coletas-ah"] });
      queryClient.invalidateQueries({ queryKey: ["professor-atividades"] });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar apostila recolhida:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setApostilaSelecionada('');
    setDataRecolhimento(formatDateSaoPaulo(new Date(), 'yyyy-MM-dd'));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" />
            Recolher Apostila
          </DialogTitle>
          <DialogDescription className="text-xs">
            Registrar apostila recolhida
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Pessoa selecionada */}
          <div className="p-3 rounded-lg border bg-muted/50">
            <p className="font-medium text-sm">{pessoaNome}</p>
            <Badge variant="outline" className="text-[10px] mt-1">
              {pessoaOrigem === 'aluno' ? 'Aluno' : 'Funcionário'}
            </Badge>
          </div>

          {/* Data de Recolhimento */}
          <div className="space-y-1.5">
            <Label htmlFor="data-recolhimento" className="text-xs">Data do recolhimento *</Label>
            <Input
              id="data-recolhimento"
              type="date"
              value={dataRecolhimento}
              onChange={(e) => setDataRecolhimento(e.target.value)}
              max={formatDateSaoPaulo(new Date(), 'yyyy-MM-dd')}
              className="h-9 text-sm"
            />
          </div>

          {/* Responsável - Exibição automática */}
          <div className="space-y-1.5">
            <Label className="text-xs">Responsável</Label>
            <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-muted">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {loadingUser ? 'Carregando...' : userName || 'Usuário não identificado'}
              </span>
            </div>
          </div>

          {/* Seletor de Apostila */}
          <div className="space-y-1.5">
            <Label htmlFor="apostila" className="text-xs">Apostila recolhida *</Label>
            <select
              id="apostila"
              className="w-full h-9 px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={apostilaSelecionada}
              onChange={(e) => setApostilaSelecionada(e.target.value)}
            >
              <option value="">{loadingApostilas ? 'Carregando...' : 'Selecione uma apostila AH'}</option>
              {apostilasAH.map((apostila) => (
                <option key={apostila} value={apostila}>
                  {apostila}
                </option>
              ))}
            </select>
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} className="flex-1 h-9 text-sm">
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmar}
              disabled={!apostilaSelecionada || !dataRecolhimento || isSubmitting || !isAuthenticated}
              className="flex-1 h-9 text-sm"
            >
              {isSubmitting ? "Salvando..." : "Confirmar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

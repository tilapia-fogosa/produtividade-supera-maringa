import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Cake, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentFuncionario } from '@/hooks/use-current-funcionario';

interface ConcluirAniversarioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aluno: {
    id: string;
    nome: string;
    aniversario_mes_dia: string;
  } | null;
  onSuccess?: () => void;
}

export function ConcluirAniversarioModal({ 
  open, 
  onOpenChange, 
  aluno,
  onSuccess 
}: ConcluirAniversarioModalProps) {
  const [observacoes, setObservacoes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { funcionario } = useCurrentFuncionario();

  const handleConcluir = async () => {
    if (!aluno) return;
    
    setIsLoading(true);
    try {
      const anoAtual = new Date().getFullYear();
      
      const { error } = await supabase
        .from('aniversarios_concluidos')
        .insert({
          aluno_id: aluno.id,
          ano: anoAtual,
          funcionario_registro_id: funcionario?.id || null,
          responsavel_nome: funcionario?.nome || 'Desconhecido',
          observacoes: observacoes.trim() || null,
        });

      if (error) {
        console.error('Erro ao registrar aniversário:', error);
        return;
      }

      setObservacoes('');
      onOpenChange(false);
      onSuccess?.();
    } finally {
      setIsLoading(false);
    }
  };

  if (!aluno) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cake className="h-5 w-5 text-pink-500" />
            Parabenizar Aniversariante
          </DialogTitle>
          <DialogDescription>
            Confirme que o aniversário de <strong>{aluno.nome}</strong> foi celebrado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground">Aniversário</p>
            <p className="text-lg font-semibold text-pink-600">{aluno.aniversario_mes_dia}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes" className="text-sm">
              Observações (opcional)
            </Label>
            <Textarea
              id="observacoes"
              placeholder="Ex: Recebeu cartão, parabéns em sala..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConcluir}
            disabled={isLoading}
            className="bg-pink-500 hover:bg-pink-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Cake className="h-4 w-4 mr-2" />
                Confirmar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface VincularProfessorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

export function VincularProfessorModal({
  open,
  onOpenChange,
  userId,
  userName,
}: VincularProfessorModalProps) {
  const [selectedProfessorId, setSelectedProfessorId] = useState<string>('');
  const queryClient = useQueryClient();

  // Buscar professores disponíveis (ativos)
  const { data: professores, isLoading } = useQuery({
    queryKey: ['professores-disponiveis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professores')
        .select('id, nome, email')
        .eq('status', true)
        .order('nome');

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Mutation para vincular professor
  const vincularMutation = useMutation({
    mutationFn: async (professorId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ professor_id: professorId })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-sem-professor'] });
      queryClient.invalidateQueries({ queryKey: ['current-professor'] });
      onOpenChange(false);
      setSelectedProfessorId('');
    },
  });

  const handleVincular = () => {
    if (selectedProfessorId) {
      vincularMutation.mutate(selectedProfessorId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vincular Professor</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Vinculando professor ao usuário: <strong>{userName}</strong>
          </p>

          <div className="space-y-2">
            <Label>Selecione o Professor</Label>
            <Select
              value={selectedProfessorId}
              onValueChange={setSelectedProfessorId}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um professor..." />
              </SelectTrigger>
              <SelectContent>
                {professores?.map((professor) => (
                  <SelectItem key={professor.id} value={professor.id}>
                    {professor.nome} {professor.email ? `(${professor.email})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleVincular}
              disabled={!selectedProfessorId || vincularMutation.isPending}
            >
              {vincularMutation.isPending ? 'Vinculando...' : 'Vincular'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

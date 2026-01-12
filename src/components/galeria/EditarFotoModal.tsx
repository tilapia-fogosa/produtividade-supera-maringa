import { useState, useEffect } from 'react';
import { useGaleriaFotos, GaleriaFoto } from '@/hooks/use-galeria-fotos';
import { useGaleriaTags } from '@/hooks/use-galeria-tags';
import { useTodasTurmas } from '@/hooks/use-todas-turmas';
import { useTodosAlunos } from '@/hooks/use-todos-alunos';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save } from 'lucide-react';

interface EditarFotoModalProps {
  foto: GaleriaFoto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditarFotoModal({ foto, open, onOpenChange }: EditarFotoModalProps) {
  const { updateFoto, isUpdating } = useGaleriaFotos();
  const { tags } = useGaleriaTags();
  const { turmas } = useTodasTurmas();
  const { alunos } = useTodosAlunos();

  const [nome, setNome] = useState('');
  const [turmaId, setTurmaId] = useState<string>('');
  const [alunoId, setAlunoId] = useState<string>('');
  const [tagsSelecionadas, setTagsSelecionadas] = useState<string[]>([]);

  useEffect(() => {
    if (foto) {
      setNome(foto.nome);
      setTurmaId(foto.turma_id || '');
      setAlunoId(foto.aluno_id || '');
      setTagsSelecionadas(foto.tags?.map(t => t.id) || []);
    }
  }, [foto]);

  const handleToggleTag = (tagId: string) => {
    setTagsSelecionadas(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async () => {
    if (!foto || !nome.trim()) return;

    try {
      await updateFoto({
        id: foto.id,
        nome: nome.trim(),
        turma_id: turmaId || null,
        aluno_id: alunoId || null,
        tag_ids: tagsSelecionadas
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar foto:', error);
    }
  };

  const handleClose = () => {
    if (!isUpdating) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Foto</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview da foto */}
          {foto && (
            <div className="w-full">
              <img
                src={foto.url}
                alt={foto.nome}
                className="max-h-48 mx-auto rounded-lg object-contain"
              />
            </div>
          )}

          {/* Nome */}
          <div className="space-y-2">
            <Label>Nome da foto *</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Evento de inauguração"
            />
          </div>

          {/* Turma */}
          <div className="space-y-2">
            <Label>Turma (opcional)</Label>
            <Select value={turmaId || "__none__"} onValueChange={(v) => setTurmaId(v === "__none__" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma turma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Nenhuma</SelectItem>
                {turmas?.map((turma) => (
                  <SelectItem key={turma.id} value={turma.id}>
                    {turma.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Aluno */}
          <div className="space-y-2">
            <Label>Aluno (opcional)</Label>
            <Select value={alunoId || "__none__"} onValueChange={(v) => setAlunoId(v === "__none__" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um aluno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Nenhum</SelectItem>
                {alunos?.map((aluno) => (
                  <SelectItem key={aluno.id} value={aluno.id}>
                    {aluno.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {tags.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma tag disponível
                </p>
              ) : (
                tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={tagsSelecionadas.includes(tag.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    style={{
                      backgroundColor: tagsSelecionadas.includes(tag.id) ? tag.cor : 'transparent',
                      borderColor: tag.cor,
                      color: tagsSelecionadas.includes(tag.id) ? 'white' : tag.cor
                    }}
                    onClick={() => handleToggleTag(tag.id)}
                  >
                    {tag.nome}
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUpdating}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!nome.trim() || isUpdating}
              className="flex-1"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

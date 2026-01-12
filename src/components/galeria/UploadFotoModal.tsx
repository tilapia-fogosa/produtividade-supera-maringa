import { useState, useRef } from 'react';
import { useGaleriaFotos } from '@/hooks/use-galeria-fotos';
import { useGaleriaTags } from '@/hooks/use-galeria-tags';
import { useTodasTurmas } from '@/hooks/use-todas-turmas';
import { useTodosAlunos } from '@/hooks/use-todos-alunos';
import { supabase } from '@/integrations/supabase/client';
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
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import imageCompression from 'browser-image-compression';

interface UploadFotoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadFotoModal({ open, onOpenChange }: UploadFotoModalProps) {
  const { createFoto, isCreating } = useGaleriaFotos();
  const { tags } = useGaleriaTags();
  const { turmas } = useTodasTurmas();
  const { alunos } = useTodosAlunos();

  const [nome, setNome] = useState('');
  const [turmaId, setTurmaId] = useState<string>('');
  const [alunoId, setAlunoId] = useState<string>('');
  const [tagsSelecionadas, setTagsSelecionadas] = useState<string[]>([]);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return;
    }

    setArquivo(file);
    setPreviewUrl(URL.createObjectURL(file));
    
    // Auto-preencher nome se vazio
    if (!nome) {
      const nomeArquivo = file.name.replace(/\.[^/.]+$/, '');
      setNome(nomeArquivo);
    }
  };

  const handleToggleTag = (tagId: string) => {
    setTagsSelecionadas(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async () => {
    if (!arquivo || !nome.trim()) return;

    setIsUploading(true);

    try {
      // Comprimir imagem
      const compressedFile = await imageCompression(arquivo, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true
      });

      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const extension = arquivo.name.split('.').pop();
      const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;

      // Upload para o storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('galeria-fotos')
        .upload(fileName, compressedFile);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('galeria-fotos')
        .getPublicUrl(uploadData.path);

      // Criar registro no banco
      await createFoto({
        nome: nome.trim(),
        url: urlData.publicUrl,
        turma_id: turmaId || null,
        aluno_id: alunoId || null,
        tag_ids: tagsSelecionadas
      });

      // Limpar formulário e fechar
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setNome('');
    setTurmaId('');
    setAlunoId('');
    setTagsSelecionadas([]);
    setArquivo(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (!isUploading && !isCreating) {
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Foto</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Área de upload */}
          <div
            className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-48 mx-auto rounded-lg object-contain"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    setArquivo(null);
                    setPreviewUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="py-8">
                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Clique para selecionar uma imagem
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

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
            <Select value={turmaId} onValueChange={setTurmaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma turma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhuma</SelectItem>
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
            <Select value={alunoId} onValueChange={setAlunoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um aluno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum</SelectItem>
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
              disabled={isUploading || isCreating}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!arquivo || !nome.trim() || isUploading || isCreating}
              className="flex-1"
            >
              {isUploading || isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Enviar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

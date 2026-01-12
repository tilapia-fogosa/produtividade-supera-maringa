import { useState, useRef } from 'react';
import { useGaleriaFotos } from '@/hooks/use-galeria-fotos';
import { useGaleriaTags } from '@/hooks/use-galeria-tags';
import { useTodasTurmas } from '@/hooks/use-todas-turmas';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, X, Loader2, Images } from 'lucide-react';
import imageCompression from 'browser-image-compression';

interface UploadLoteFotoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadLoteFotoModal({ open, onOpenChange }: UploadLoteFotoModalProps) {
  const { createFoto } = useGaleriaFotos();
  const { tags } = useGaleriaTags();
  const { turmas } = useTodasTurmas();

  const [turmaId, setTurmaId] = useState<string>('');
  const [tagsSelecionadas, setTagsSelecionadas] = useState<string[]>([]);
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    setArquivos(prev => [...prev, ...imageFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setArquivos(prev => prev.filter((_, i) => i !== index));
  };

  const handleToggleTag = (tagId: string) => {
    setTagsSelecionadas(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async () => {
    if (arquivos.length === 0) return;

    setIsUploading(true);
    setProgresso(0);
    setUploadedCount(0);

    try {
      for (let i = 0; i < arquivos.length; i++) {
        const arquivo = arquivos[i];

        // Comprimir imagem
        const compressedFile = await imageCompression(arquivo, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true
        });

        // Gerar nome único
        const timestamp = Date.now();
        const extension = arquivo.name.split('.').pop();
        const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;

        // Upload
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('galeria-fotos')
          .upload(fileName, compressedFile);

        if (uploadError) {
          console.error('Erro no upload:', uploadError);
          continue;
        }

        // Obter URL
        const { data: urlData } = supabase.storage
          .from('galeria-fotos')
          .getPublicUrl(uploadData.path);

        // Criar registro
        const nomeArquivo = arquivo.name.replace(/\.[^/.]+$/, '');
        await createFoto({
          nome: nomeArquivo,
          url: urlData.publicUrl,
          turma_id: turmaId || null,
          tag_ids: tagsSelecionadas
        });

        setUploadedCount(i + 1);
        setProgresso(((i + 1) / arquivos.length) * 100);
      }

      // Limpar e fechar
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao fazer upload em lote:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setTurmaId('');
    setTagsSelecionadas([]);
    setArquivos([]);
    setProgresso(0);
    setUploadedCount(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload em Lote</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Área de upload */}
          <div
            className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Images className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Clique para selecionar múltiplas imagens
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFilesSelect}
            />
          </div>

          {/* Lista de arquivos */}
          {arquivos.length > 0 && (
            <div className="space-y-2">
              <Label>{arquivos.length} arquivo(s) selecionado(s)</Label>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {arquivos.map((arquivo, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                  >
                    <span className="truncate flex-1">{arquivo.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => handleRemoveFile(index)}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progresso */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Enviando...</span>
                <span>{uploadedCount}/{arquivos.length}</span>
              </div>
              <Progress value={progresso} />
            </div>
          )}

          {/* Turma */}
          <div className="space-y-2">
            <Label>Turma para todas as fotos (opcional)</Label>
            <Select value={turmaId} onValueChange={setTurmaId} disabled={isUploading}>
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

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags para todas as fotos</Label>
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
                    onClick={() => !isUploading && handleToggleTag(tag.id)}
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
              disabled={isUploading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={arquivos.length === 0 || isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Enviar {arquivos.length > 0 && `(${arquivos.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

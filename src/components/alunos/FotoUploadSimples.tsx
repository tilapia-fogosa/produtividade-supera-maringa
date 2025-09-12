import React, { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface FotoUploadSimplesProps {
  fotoUrl: string | null;
  onFotoChange: (novaUrl: string | null) => void;
  nomeAluno?: string;
}

export function FotoUploadSimples({ fotoUrl, onFotoChange, nomeAluno = "Aluno" }: FotoUploadSimplesProps) {
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const obterIniciais = (nome: string) => {
    return nome
      .split(' ')
      .filter(part => part.length > 0)
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const validarArquivo = (file: File) => {
    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const tamanhoMaximo = 5 * 1024 * 1024; // 5MB

    if (!tiposPermitidos.includes(file.type)) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Apenas JPEG, PNG e WEBP são permitidos",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > tamanhoMaximo) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 5MB",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const fazerUpload = async (file: File) => {
    setUploading(true);
    try {
      // Gerar um nome único para o arquivo temporário
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2);
      const extensao = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const nomeArquivo = `temp_${timestamp}_${randomId}.${extensao}`;

      // Upload para o bucket fotos-pessoas
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fotos-pessoas')
        .upload(nomeArquivo, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      // Obter URL pública
      const { data: publicUrlData } = supabase.storage
        .from('fotos-pessoas')
        .getPublicUrl(uploadData.path);

      const novaUrl = publicUrlData.publicUrl;
      onFotoChange(novaUrl);

      toast({
        title: "Foto enviada!",
        description: "Foto carregada com sucesso",
      });

    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removerFoto = async () => {
    if (!fotoUrl) return;

    setRemoving(true);
    try {
      // Extrair o path da URL
      const urlParts = fotoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1].split('?')[0];

      // Remover do storage
      const { error } = await supabase.storage
        .from('fotos-pessoas')
        .remove([fileName]);

      if (error) {
        console.error('Erro ao remover foto:', error);
      }

      onFotoChange(null);

      toast({
        title: "Foto removida",
        description: "Foto removida com sucesso",
      });

    } catch (error) {
      console.error('Erro ao remover foto:', error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover a foto",
        variant: "destructive",
      });
    } finally {
      setRemoving(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && validarArquivo(file)) {
      fazerUpload(file);
    }
    // Limpar o input para permitir selecionar o mesmo arquivo novamente
    event.target.value = '';
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-20 w-20">
        <AvatarImage 
          src={fotoUrl || undefined} 
          alt={`Foto de ${nomeAluno}`}
        />
        <AvatarFallback className="text-lg font-semibold bg-primary/10">
          {obterIniciais(nomeAluno)}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || removing}
          className="flex items-center gap-2"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
          {fotoUrl ? 'Alterar Foto' : 'Adicionar Foto'}
        </Button>

        {fotoUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={removerFoto}
            disabled={uploading || removing}
            className="flex items-center gap-2 text-destructive hover:text-destructive"
          >
            {removing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Remover Foto
          </Button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
      />
    </div>
  );
}
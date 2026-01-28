import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Trash2, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

interface FotoUploadProps {
  alunoId: string;
  alunoNome: string;
  fotoUrl: string | null;
  onFotoUpdate: (novaFotoUrl: string | null) => Promise<boolean>;
}

export function FotoUpload({ alunoId, alunoNome, fotoUrl, onFotoUpdate }: FotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const obterIniciais = (nome: string) => {
    return nome
      .split(' ')
      .map(palavra => palavra.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const validarArquivo = (file: File): boolean => {
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    const tamanhoMaximo = 5 * 1024 * 1024; // 5MB

    if (!tiposPermitidos.includes(file.type)) {
      console.error('Tipo de arquivo inválido:', file.type);
      return false;
    }

    if (file.size > tamanhoMaximo) {
      console.error('Arquivo muito grande:', file.size);
      return false;
    }

    return true;
  };

  const fazerUpload = async (file: File) => {
    try {
      setUploading(true);

      // Gerar nome único para o arquivo
      const extensao = file.name.split('.').pop()?.toLowerCase();
      const nomeArquivo = `aluno_${alunoId}_${Date.now()}.${extensao}`;
      const caminhoArquivo = `alunos/${alunoId}/${nomeArquivo}`;

      console.log('Iniciando upload da foto:', { nomeArquivo, caminhoArquivo });

      // Se já tem foto, remover a anterior
      if (fotoUrl) {
        console.log('Removendo foto anterior:', fotoUrl);
        await removerFotoAnterior();
      }

      // Upload do novo arquivo
      const { error: uploadError } = await supabase.storage
        .from('fotos-pessoas')
        .upload(caminhoArquivo, file);

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        throw uploadError;
      }

      console.log('Upload realizado com sucesso');

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('fotos-pessoas')
        .getPublicUrl(caminhoArquivo);

      const novaFotoUrl = urlData.publicUrl;
      console.log('URL pública gerada:', novaFotoUrl);

      // Atualizar no banco de dados
      const sucesso = await onFotoUpdate(novaFotoUrl);
      console.log('Resultado da atualização no banco:', sucesso);

      return sucesso;
    } catch (error) {
      console.error('Erro no upload da foto:', error);
      return false;
    } finally {
      setUploading(false);
    }
  };

  const removerFotoAnterior = async () => {
    if (!fotoUrl) return;

    try {
      // Extrair caminho do arquivo da URL
      const url = new URL(fotoUrl);
      const caminho = url.pathname.split('/fotos-pessoas/')[1];
      
      if (caminho) {
        await supabase.storage
          .from('fotos-pessoas')
          .remove([caminho]);
      }
    } catch (error) {
      console.error('Erro ao remover foto anterior:', error);
    }
  };

  const removerFoto = async () => {
    if (!fotoUrl) return;

    try {
      setRemoving(true);

      // Remover arquivo do storage
      await removerFotoAnterior();

      // Atualizar no banco de dados
      await onFotoUpdate(null);
    } catch (error) {
      console.error('Erro ao remover foto:', error);
    } finally {
      setRemoving(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && validarArquivo(file)) {
      fazerUpload(file);
    }
    // Limpar input para permitir selecionar o mesmo arquivo novamente
    event.target.value = '';
  };

  // Função para gerar URL com cache busting
  const obterUrlComCacheBust = (url: string | null) => {
    if (!url) return undefined;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}cb=${Date.now()}`;
  };

  const handleImageLoad = () => {
    console.log('Imagem carregada com sucesso:', fotoUrl);
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    console.error('Erro ao carregar imagem:', fotoUrl);
    setImageLoading(false);
    setImageError(true);
  };

  const iniciais = obterIniciais(alunoNome);
  const urlComCacheBust = obterUrlComCacheBust(fotoUrl);

  // Reset image loading state when foto URL changes
  useEffect(() => {
    if (fotoUrl) {
      console.log('Nova foto URL detectada:', fotoUrl);
      setImageLoading(true);
      setImageError(false);
    } else {
      setImageLoading(false);
      setImageError(false);
    }
  }, [fotoUrl]);

  return (
    <div className="flex flex-col items-center space-y-3">
      <Avatar className="h-42 w-42 md:h-52 md:w-52">
        <AvatarImage 
          src={urlComCacheBust} 
          alt={`Foto de ${alunoNome}`}
          className="object-cover"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        <AvatarFallback className="text-2xl md:text-3xl font-semibold bg-primary/10">
          {imageError ? (
            <div className="text-sm text-center">
              Erro ao<br/>carregar
            </div>
          ) : (
            iniciais
          )}
        </AvatarFallback>
      </Avatar>

      {imageLoading && fotoUrl && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Carregando imagem...
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || removing}
          size="sm"
          variant={fotoUrl ? "outline" : "default"}
          className="flex items-center gap-2"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : fotoUrl ? (
            <Camera className="h-4 w-4" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? "Enviando..." : fotoUrl ? "Alterar" : "Adicionar"}
        </Button>

        {fotoUrl && (
          <Button
            onClick={removerFoto}
            disabled={uploading || removing}
            size="sm"
            variant="outline"
            className="flex items-center gap-2 text-destructive hover:text-destructive"
          >
            {removing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {removing ? "Removendo..." : "Remover"}
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
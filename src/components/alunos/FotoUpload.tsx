import React, { useState, useRef } from 'react';
import { Camera, Upload, Trash2, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface FotoUploadProps {
  alunoId: string;
  alunoNome: string;
  fotoUrl: string | null;
  onFotoUpdate: (novaFotoUrl: string | null) => Promise<boolean>;
}

export function FotoUpload({ alunoId, alunoNome, fotoUrl, onFotoUpdate }: FotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
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
      toast({
        title: "Tipo de arquivo inválido",
        description: "Por favor, selecione um arquivo JPG, PNG ou WEBP.",
        variant: "destructive"
      });
      return false;
    }

    if (file.size > tamanhoMaximo) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 5MB.",
        variant: "destructive"
      });
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

      // Se já tem foto, remover a anterior
      if (fotoUrl) {
        await removerFotoAnterior();
      }

      // Upload do novo arquivo
      const { error: uploadError } = await supabase.storage
        .from('fotos-pessoas')
        .upload(caminhoArquivo, file);

      if (uploadError) {
        throw uploadError;
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('fotos-pessoas')
        .getPublicUrl(caminhoArquivo);

      const novaFotoUrl = urlData.publicUrl;

      // Atualizar no banco de dados
      const sucesso = await onFotoUpdate(novaFotoUrl);
      
      if (sucesso) {
        toast({
          title: "Sucesso",
          description: "Foto enviada com sucesso!",
        });
      }

      return sucesso;
    } catch (error) {
      console.error('Erro no upload da foto:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a foto. Tente novamente.",
        variant: "destructive"
      });
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
      const sucesso = await onFotoUpdate(null);
      
      if (sucesso) {
        toast({
          title: "Sucesso",
          description: "Foto removida com sucesso!",
        });
      }
    } catch (error) {
      console.error('Erro ao remover foto:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a foto. Tente novamente.",
        variant: "destructive"
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
    // Limpar input para permitir selecionar o mesmo arquivo novamente
    event.target.value = '';
  };

  const iniciais = obterIniciais(alunoNome);

  return (
    <div className="flex flex-col items-center space-y-3">
      <Avatar className="h-24 w-24 md:h-32 md:w-32">
        <AvatarImage 
          src={fotoUrl || undefined} 
          alt={`Foto de ${alunoNome}`}
          className="object-cover"
        />
        <AvatarFallback className="text-lg md:text-xl font-semibold bg-primary/10">
          {iniciais}
        </AvatarFallback>
      </Avatar>

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
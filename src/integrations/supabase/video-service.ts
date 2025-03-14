
import { supabase } from './client';
import { toast } from '@/hooks/use-toast';

export interface Video {
  id: string;
  name: string;
  description?: string;
  original_filename: string;
  hls_url?: string;
  duration: number;
  thumbnail_url?: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  created_at: string;
  updated_at: string;
}

export async function uploadVideo(file: File, name: string, description?: string): Promise<Video | null> {
  try {
    // 1. Criar o registro do vídeo no banco de dados
    const { data: videoRecord, error: dbError } = await supabase
      .from('videos')
      .insert({
        name: name || file.name.replace(/\.[^/.]+$/, ""),
        description,
        original_filename: file.name,
        status: 'uploading'
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Falha ao criar registro do vídeo: ${dbError.message}`);
    }

    // 2. Fazer upload do arquivo para o Storage
    const videoId = videoRecord.id;
    const filePath = `${videoId}/${file.name}`;
    
    const { error: uploadError } = await supabase
      .storage
      .from('videos')
      .upload(filePath, file);

    if (uploadError) {
      // Se falhar o upload, atualize o registro para status de erro
      await supabase
        .from('videos')
        .update({ status: 'error' })
        .eq('id', videoId);
        
      throw new Error(`Falha ao fazer upload do arquivo: ${uploadError.message}`);
    }

    // 3. Chamar a função de processamento do vídeo
    const { data: processedData, error: processError } = await supabase.functions
      .invoke('process-video', {
        body: { videoId, videoPath: filePath }
      });

    if (processError) {
      console.error('Erro ao processar vídeo:', processError);
      // O processamento é assíncrono, então não vamos falhar aqui
    }

    return videoRecord;
  } catch (error) {
    console.error('Erro ao fazer upload do vídeo:', error);
    toast({
      title: "Erro ao fazer upload",
      description: error.message,
      variant: "destructive"
    });
    return null;
  }
}

export async function fetchVideos(): Promise<Video[]> {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar vídeos:', error);
    toast({
      title: "Erro ao carregar vídeos",
      description: "Não foi possível carregar a lista de vídeos.",
      variant: "destructive"
    });
    return [];
  }
}

export async function getVideo(id: string): Promise<Video | null> {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`Erro ao buscar vídeo ${id}:`, error);
    return null;
  }
}

export async function deleteVideo(id: string): Promise<boolean> {
  try {
    // Primeiro obtemos o vídeo para saber o nome do arquivo
    const video = await getVideo(id);
    if (!video) {
      throw new Error("Vídeo não encontrado");
    }

    // Remover o arquivo do Storage
    const { error: storageError } = await supabase
      .storage
      .from('videos')
      .remove([`${id}/${video.original_filename}`]);

    if (storageError) {
      console.error('Erro ao remover arquivo:', storageError);
      // Continuamos mesmo com erro no storage
    }

    // Remover o registro do banco de dados
    const { error: dbError } = await supabase
      .from('videos')
      .delete()
      .eq('id', id);

    if (dbError) {
      throw dbError;
    }

    return true;
  } catch (error) {
    console.error('Erro ao excluir vídeo:', error);
    toast({
      title: "Erro ao excluir vídeo",
      description: "Não foi possível excluir o vídeo.",
      variant: "destructive"
    });
    return false;
  }
}

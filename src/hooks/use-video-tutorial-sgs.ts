import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useVideoTutorialSGS = () => {
  const { data: videoUrl, isLoading } = useQuery({
    queryKey: ['video-tutorial-sgs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dados_importantes')
        .select('data')
        .eq('key', 'video_tutorial_sgs_url')
        .single();

      if (error) {
        console.warn('URL do vídeo tutorial SGS não encontrada, usando URL padrão');
        return 'https://exemplo-pandavideo.com/hls/tutorial-sgs.m3u8';
      }

      return data?.data || 'https://exemplo-pandavideo.com/hls/tutorial-sgs.m3u8';
    }
  });

  return {
    videoUrl: videoUrl || 'https://exemplo-pandavideo.com/hls/tutorial-sgs.m3u8',
    isLoading
  };
};
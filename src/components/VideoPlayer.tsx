
import React, { useEffect, useRef } from 'react';
import 'video.js/dist/video-js.css';

interface VideoPlayerProps {
  src: string;
  poster?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (videoRef.current) {
      // Carregar os scripts de HLS apenas quando o componente for montado
      const loadHlsScript = async () => {
        // Verificar se o vídeo.js já está disponível na janela
        if (!(window as any).videojs) {
          const videojs = await import('video.js');
          (window as any).videojs = videojs.default;
          
          // Carrega o plugin HLS
          await import('@videojs/http-streaming');
        }
        
        // Inicializar o player
        const player = (window as any).videojs(videoRef.current, {
          controls: true,
          autoplay: false,
          preload: 'auto',
          fluid: true,
          responsive: true,
          poster: poster,
          sources: [{
            src: src,
            type: 'application/x-mpegURL'
          }]
        });
        
        // Limpar o player quando o componente for desmontado
        return () => {
          if (player) {
            player.dispose();
          }
        };
      };
      
      const cleanup = loadHlsScript();
      
      return () => {
        // Chama a função de limpeza quando o componente for desmontado
        cleanup.then(cleanupFn => {
          if (cleanupFn) cleanupFn();
        });
      };
    }
  }, [src, poster]);
  
  return (
    <div ref={containerRef} className="video-container w-full aspect-video bg-black rounded-md overflow-hidden">
      <div data-vjs-player>
        <video
          ref={videoRef}
          className="video-js vjs-big-play-centered"
          playsInline
        />
      </div>
    </div>
  );
};

export default VideoPlayer;

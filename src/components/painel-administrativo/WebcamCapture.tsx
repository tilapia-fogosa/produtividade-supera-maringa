import React, { useState, useRef, useCallback, useEffect } from "react";
import { Camera, RotateCcw, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface WebcamCaptureProps {
  onCapture: (imageData: string) => void;
  capturedImage: string | null;
  onClear: () => void;
}

export function WebcamCapture({ onCapture, capturedImage, onClear }: WebcamCaptureProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 720 },
          height: { ideal: 720 },
          facingMode: "user"
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      setError("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Calcular dimensões para corte quadrado (1:1)
    const size = Math.min(video.videoWidth, video.videoHeight);
    const offsetX = (video.videoWidth - size) / 2;
    const offsetY = (video.videoHeight - size) / 2;
    
    // Definir tamanho do canvas como quadrado
    canvas.width = 720;
    canvas.height = 720;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Desenhar a porção central (quadrada) do vídeo
    ctx.drawImage(
      video,
      offsetX, offsetY, size, size, // Origem (corte quadrado do centro)
      0, 0, 720, 720 // Destino (canvas 720x720)
    );
    
    // Converter para base64
    const imageData = canvas.toDataURL("image/jpeg", 0.9);
    onCapture(imageData);
    stopCamera();
  }, [onCapture, stopCamera]);

  // Limpar stream ao desmontar
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Se já tem foto capturada, mostrar preview
  if (capturedImage) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Foto do Aluno
        </h3>
        <div className="flex items-start gap-4">
          <div className="w-32 rounded-lg overflow-hidden border">
            <AspectRatio ratio={1}>
              <img 
                src={capturedImage} 
                alt="Foto capturada" 
                className="w-full h-full object-cover"
              />
            </AspectRatio>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onClear();
                startCamera();
              }}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Tirar outra
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="flex items-center gap-2 text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4" />
              Remover
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Foto do Aluno
      </h3>
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {!isStreaming ? (
        <Button
          type="button"
          variant="outline"
          onClick={startCamera}
          className="flex items-center gap-2"
        >
          <Camera className="h-4 w-4" />
          Abrir câmera
        </Button>
      ) : (
        <div className="flex items-start gap-4">
          {/* Container do vídeo com aspect ratio 1:1 */}
          <div className="w-48 rounded-lg overflow-hidden border bg-muted">
            <AspectRatio ratio={1}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </AspectRatio>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              onClick={capturePhoto}
              size="sm"
              className="flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              Capturar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={stopCamera}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>
          </div>
        </div>
      )}
      
      {/* Canvas oculto para captura */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

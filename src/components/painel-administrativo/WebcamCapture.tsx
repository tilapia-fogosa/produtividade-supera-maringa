import React, { useState } from "react";
import { Camera, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { WebcamCaptureModal } from "./WebcamCaptureModal";

interface WebcamCaptureProps {
  onCapture: (imageData: string) => void;
  capturedImage: string | null;
  onClear: () => void;
}

export function WebcamCapture({ onCapture, capturedImage, onClear }: WebcamCaptureProps) {
  const [modalOpen, setModalOpen] = useState(false);

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
              onClick={() => setModalOpen(true)}
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

        <WebcamCaptureModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onCapture={onCapture}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Foto do Aluno
      </h3>
      
      <Button
        type="button"
        variant="outline"
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-2"
      >
        <Camera className="h-4 w-4" />
        Abrir câmera
      </Button>

      <WebcamCaptureModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCapture={onCapture}
      />
    </div>
  );
}

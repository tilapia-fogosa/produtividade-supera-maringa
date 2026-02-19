import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AudioTranscribeButtonProps {
  currentValue: string;
  onTranscribed: (newValue: string) => void;
  className?: string;
}

export function AudioTranscribeButton({ currentValue, onTranscribed, className }: AudioTranscribeButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
    } catch (error) {
      console.error("Erro ao acessar microfone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    console.log('AudioTranscribeButton: tamanho do áudio capturado:', audioBlob.size, 'bytes');
    
    if (audioBlob.size < 1000) {
      console.log('AudioTranscribeButton: áudio muito pequeno, ignorando');
      return;
    }

    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');

      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: formData,
      });

      if (error) throw error;

      if (data?.text) {
        const newValue = currentValue ? `${currentValue} ${data.text}` : data.text;
        onTranscribed(newValue);
      }
    } catch (error) {
      console.error("Erro na transcrição:", error);
    } finally {
      setIsTranscribing(false);
    }
  };

  if (isRecording) {
    return (
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className={`h-6 px-2 text-[10px] ${className || ''}`}
        onClick={stopRecording}
      >
        <Square className="mr-1 h-3 w-3" />
        Parar
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={`h-6 px-2 text-[10px] ${className || ''}`}
      onClick={startRecording}
      disabled={isTranscribing}
    >
      {isTranscribing ? (
        <>
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          Transcrevendo...
        </>
      ) : (
        <>
          <Mic className="mr-1 h-3 w-3" />
          Gravar
        </>
      )}
    </Button>
  );
}

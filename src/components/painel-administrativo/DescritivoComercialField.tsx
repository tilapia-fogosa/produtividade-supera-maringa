import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DescritivoComercialFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function DescritivoComercialField({ value, onChange }: DescritivoComercialFieldProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        }
      });
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/mp4';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
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
    console.log('DescritivoComercial: tamanho do áudio:', audioBlob.size, 'bytes');
    
    if (audioBlob.size < 1000) {
      console.log('DescritivoComercial: áudio muito pequeno, ignorando');
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
        const newValue = value ? `${value} ${data.text}` : data.text;
        onChange(newValue);
      }
    } catch (error) {
      console.error("Erro na transcrição:", error);
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold">Descritivo Comercial</Label>
      <Textarea
        placeholder="Descreva informações comerciais do aluno..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
      />
      <div className="flex gap-2">
        {isRecording ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={stopRecording}
          >
            <Square className="mr-2 h-4 w-4" />
            Parar Gravação
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={startRecording}
            disabled={isTranscribing}
          >
            {isTranscribing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Transcrevendo...
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Gravar Áudio
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

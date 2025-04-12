
import React from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, X } from 'lucide-react';

interface PresencaSectionProps {
  presente: "sim" | "não";
  setPresente: (value: "sim" | "não") => void;
  motivoFalta: string;
  setMotivoFalta: (value: string) => void;
}

const PresencaSection: React.FC<PresencaSectionProps> = ({
  presente,
  setPresente,
  motivoFalta,
  setMotivoFalta
}) => {
  return (
    <>
      <div className="space-y-2">
        <Label>Aluno veio à aula?</Label>
        <div className="flex gap-4">
          <RadioGroup value={presente} onValueChange={(v) => setPresente(v as "sim" | "não")} className="flex flex-row gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sim" id="presente-sim" />
              <Label htmlFor="presente-sim" className="flex items-center">
                <Check className="mr-1 h-4 w-4 text-green-500" /> Sim
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="não" id="presente-nao" />
              <Label htmlFor="presente-nao" className="flex items-center">
                <X className="mr-1 h-4 w-4 text-red-500" /> Não
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>
      
      {presente === "não" && (
        <div className="space-y-2">
          <Label htmlFor="motivo-falta">Motivo da falta (opcional)</Label>
          <Textarea 
            id="motivo-falta" 
            value={motivoFalta} 
            onChange={(e) => setMotivoFalta(e.target.value)}
            className="w-full"
            placeholder="Informe o motivo da falta (opcional)"
          />
        </div>
      )}
    </>
  );
};

export default PresencaSection;

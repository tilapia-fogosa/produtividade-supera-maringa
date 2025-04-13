
import React from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, X } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PresencaSectionProps {
  presente: "sim" | "não";
  setPresente: (value: "sim" | "não") => void;
  motivoFalta: string;
  setMotivoFalta: (value: string) => void;
  alunoId: string;
}

const PresencaSection: React.FC<PresencaSectionProps> = ({
  presente,
  setPresente,
  motivoFalta,
  setMotivoFalta,
  alunoId
}) => {
  const handlePresencaChange = async (value: "sim" | "não") => {
    setPresente(value);
    
    // Se mudou para "não", registrar falta
    if (value === "não") {
      // Não faça nada ainda, a falta será registrada ao salvar o formulário
    } else {
      // Se mudou para "sim", verificar se existe falta registrada hoje e remover
      try {
        const dataHoje = new Date().toISOString().split('T')[0];
        
        const { error } = await supabase
          .from('faltas_alunos')
          .delete()
          .eq('aluno_id', alunoId)
          .eq('data_falta', dataHoje);
          
        if (error) {
          console.error('Erro ao remover registro de falta:', error);
        }
      } catch (error) {
        console.error('Erro ao processar presença:', error);
      }
    }
  };

  return (
    <>
      <div className="space-y-2">
        <Label className="text-azul-500">Aluno veio à aula?</Label>
        <div className="flex gap-4">
          <RadioGroup value={presente} onValueChange={(v) => handlePresencaChange(v as "sim" | "não")} className="flex flex-row gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sim" id="presente-sim" />
              <Label htmlFor="presente-sim" className="flex items-center text-azul-500">
                <Check className="mr-1 h-4 w-4 text-green-500" /> Sim
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="não" id="presente-nao" />
              <Label htmlFor="presente-nao" className="flex items-center text-azul-500">
                <X className="mr-1 h-4 w-4 text-red-500" /> Não
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>
      
      {presente === "não" && (
        <div className="space-y-2">
          <Label htmlFor="motivo-falta" className="text-azul-500">Motivo da falta (opcional)</Label>
          <Textarea 
            id="motivo-falta" 
            value={motivoFalta} 
            onChange={(e) => setMotivoFalta(e.target.value)}
            className="w-full border-orange-200"
            placeholder="Informe o motivo da falta (opcional)"
          />
        </div>
      )}
    </>
  );
};

export default PresencaSection;

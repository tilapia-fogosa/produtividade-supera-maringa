
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Aluno } from '@/hooks/use-professor-turmas';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAhLancamento } from '@/hooks/use-ah-lancamento';
import AhSection from './produtividade/AhSection';

interface AhLancamentoModalProps {
  isOpen: boolean;
  aluno: Aluno;
  onClose: () => void;
  onSuccess?: (alunoId: string) => void;
  onError?: (errorMessage: string) => void;
}

const AhLancamentoModal: React.FC<AhLancamentoModalProps> = ({
  isOpen,
  aluno,
  onClose,
  onSuccess,
  onError
}) => {
  const isMobile = useIsMobile();
  const { registrarLancamentoAH, isLoading } = useAhLancamento(aluno.id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lancouAh, setLancouAh] = useState<"sim" | "não">("sim");
  const [apostilaAh, setApostilaAh] = useState("");
  const [exerciciosAh, setExerciciosAh] = useState("");
  const [errosAh, setErrosAh] = useState("");
  const [professorCorrecao, setProfessorCorrecao] = useState("");
  const [comentario, setComentario] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setLancouAh("sim");
      setApostilaAh("");
      setExerciciosAh("");
      setErrosAh("");
      setProfessorCorrecao("");
      setComentario("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (lancouAh === "sim") {
      if (!apostilaAh) {
        toast({
          title: "Erro",
          description: "Selecione a apostila AH",
          variant: "destructive"
        });
        return;
      }
      
      if (!exerciciosAh) {
        toast({
          title: "Erro",
          description: "Informe a quantidade de exercícios realizados",
          variant: "destructive"
        });
        return;
      }
      
      if (!professorCorrecao) {
        toast({
          title: "Erro",
          description: "Selecione quem corrigiu",
          variant: "destructive"
        });
        return;
      }
    }

    try {
      setIsSubmitting(true);
      
      if (lancouAh === "sim") {
        const lancamentoData = {
          aluno_id: aluno.id,
          apostila: apostilaAh,
          exercicios: parseInt(exerciciosAh) || 0,
          erros: parseInt(errosAh) || 0,
          professor_correcao: professorCorrecao,
          comentario: comentario || undefined,
        };

        console.log('AH lançamento data:', lancamentoData);
        
        const success = await registrarLancamentoAH(lancamentoData);
        
        if (success) {
          if (onSuccess) {
            onSuccess(aluno.id);
          }
          onClose();
        }
      } else {
        // Se não lançou AH, apenas fecha o modal
        onClose();
      }
    } catch (error) {
      console.error("AhLancamentoModal: Erro ao registrar AH:", error);
      
      let errorMessage = "Não foi possível registrar o lançamento AH. Tente novamente.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      if (onError) {
        onError(errorMessage);
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`max-w-md ${isMobile ? "w-[95%] p-4" : ""}`}>
        <DialogHeader>
          <DialogTitle className={isMobile ? "text-lg" : ""}>
            Lançamento Abrindo Horizontes - {aluno.nome}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <AhSection 
              lancouAh={lancouAh}
              setLancouAh={setLancouAh}
              apostilaAh={apostilaAh}
              setApostilaAh={setApostilaAh}
              exerciciosAh={exerciciosAh}
              setExerciciosAh={setExerciciosAh}
              errosAh={errosAh}
              setErrosAh={setErrosAh}
              professorCorrecao={professorCorrecao}
              setProfessorCorrecao={setProfessorCorrecao}
            />
            
            {lancouAh === "sim" && (
              <div className="space-y-2">
                <label htmlFor="comentario" className="text-sm font-medium">Comentários (opcional)</label>
                <Textarea
                  id="comentario"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Observações sobre a correção"
                  rows={3}
                />
              </div>
            )}
            
            <DialogFooter className={isMobile ? "flex-col space-y-2" : ""}>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
                className={isMobile ? "w-full" : ""}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className={isMobile ? "w-full" : ""}
              >
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AhLancamentoModal;

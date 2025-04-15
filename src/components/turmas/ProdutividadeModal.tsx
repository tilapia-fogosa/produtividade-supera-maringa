import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Aluno, Turma } from '@/hooks/use-professor-turmas';
import PresencaSection from './produtividade/PresencaSection';
import AbacoSection from './produtividade/AbacoSection';
import { encontrarApostilaMaisProxima } from './utils/apostilasUtils';
import AlunoProgressoCard from './produtividade/AlunoProgressoCard';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProdutividade } from '@/hooks/use-produtividade';

interface ProdutividadeModalProps {
  isOpen: boolean;
  aluno: Aluno;
  turma: Turma;
  onClose: () => void;
  onSuccess?: (alunoId: string) => void;
  onError?: (errorMessage: string) => void;
}

const ProdutividadeModal: React.FC<ProdutividadeModalProps> = ({
  isOpen,
  aluno,
  turma,
  onClose,
  onSuccess,
  onError
}) => {
  const isMobile = useIsMobile();
  const { registrarPresenca, registrarProdutividade, isLoading } = useProdutividade(aluno.id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [presente, setPresente] = useState<"sim" | "não">("sim");
  const [motivoFalta, setMotivoFalta] = useState("");
  
  const [apostilaAbaco, setApostilaAbaco] = useState("");
  const [paginaAbaco, setPaginaAbaco] = useState("");
  const [exerciciosAbaco, setExerciciosAbaco] = useState("");
  const [errosAbaco, setErrosAbaco] = useState("");
  const [fezDesafio, setFezDesafio] = useState<"sim" | "não">("não");
  const [comentario, setComentario] = useState("");
  const [apostilas, setApostilas] = useState<{nome: string, total_paginas: number}[]>([]);

  useEffect(() => {
    const carregarApostilas = async () => {
      try {
        const { data, error } = await supabase
          .from('apostilas')
          .select('nome, total_paginas')
          .order('nome');
          
        if (error) {
          console.error("Erro ao carregar apostilas:", error);
          return;
        }
        
        if (data) {
          setApostilas(data);
        }
      } catch (error) {
        console.error("Erro ao carregar apostilas:", error);
      }
    };
    
    carregarApostilas();
  }, []);

  useEffect(() => {
    if (isOpen && aluno) {
      if (aluno.apostila_atual) {
        setApostilaAbaco(aluno.apostila_atual);
      } else if (aluno.ultimo_nivel) {
        const apostilaSugerida = encontrarApostilaMaisProxima(aluno.ultimo_nivel);
        setApostilaAbaco(apostilaSugerida);
      }
      
      if (aluno.ultima_pagina) {
        setPaginaAbaco(aluno.ultima_pagina);
      }
    }
  }, [isOpen, aluno]);

  useEffect(() => {
    if (!isOpen) {
      setPresente("sim");
      setMotivoFalta("");
      setApostilaAbaco("");
      setPaginaAbaco("");
      setExerciciosAbaco("");
      setErrosAbaco("");
      setFezDesafio("não");
      setComentario("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (presente === "sim" && !apostilaAbaco) {
      toast({
        title: "Erro",
        description: "Selecione a apostila do ábaco",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const dataHoje = new Date().toISOString().split('T')[0];

      const presencaRegistrada = await registrarPresenca(
        presente === "sim",
        dataHoje,
        presente === "não" ? motivoFalta : undefined
      );
      
      if (!presencaRegistrada) {
        throw new Error("Falha ao registrar presença");
      }

      if (presente === "sim") {
        // Registrar produtividade do ábaco
        const produtividadeRegistrada = await registrarProdutividade({
          data_aula: dataHoje,
          presente: true,
          apostila: apostilaAbaco,
          pagina: paginaAbaco,
          exercicios: exerciciosAbaco ? Number(exerciciosAbaco) : undefined,
          erros: errosAbaco ? Number(errosAbaco) : undefined,
          fez_desafio: fezDesafio === "sim",
          comentario: comentario,
          is_reposicao: false
        });
        
        if (!produtividadeRegistrada) {
          throw new Error("Falha ao registrar produtividade");
        }
      }

      if (onSuccess) {
        onSuccess(aluno.id);
      }
      
      onClose();
    } catch (error) {
      console.error("Erro ao registrar produtividade:", error);
      
      let errorMessage = "Não foi possível registrar a produtividade. Tente novamente.";
      
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
            Registrar produtividade - {aluno.nome}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-4">
            <AlunoProgressoCard alunoId={aluno.id} />
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <PresencaSection 
                presente={presente}
                setPresente={setPresente}
                motivoFalta={motivoFalta}
                setMotivoFalta={setMotivoFalta}
                alunoId={aluno.id}
              />
              
              {presente === "sim" && (
                <>
                  <AbacoSection 
                    apostilaAbaco={apostilaAbaco}
                    setApostilaAbaco={setApostilaAbaco}
                    paginaAbaco={paginaAbaco}
                    setPaginaAbaco={setPaginaAbaco}
                    exerciciosAbaco={exerciciosAbaco}
                    setExerciciosAbaco={setExerciciosAbaco}
                    errosAbaco={errosAbaco}
                    setErrosAbaco={setErrosAbaco}
                    fezDesafio={fezDesafio}
                    setFezDesafio={setFezDesafio}
                    comentario={comentario}
                    setComentario={setComentario}
                    apostilas={apostilas}
                  />
                </>
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
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ProdutividadeModal;

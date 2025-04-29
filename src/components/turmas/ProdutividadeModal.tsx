
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
import AlunoProgressoCard from './produtividade/AlunoProgressoCard';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProdutividade } from '@/hooks/use-produtividade';
import { useApostilas } from '@/hooks/use-apostilas';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Edit } from "lucide-react";

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
  const { getApostila } = useApostilas();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [presente, setPresente] = useState<"sim" | "não">("sim");
  const [motivoFalta, setMotivoFalta] = useState("");
  
  const [apostilaAbaco, setApostilaAbaco] = useState("");
  const [paginaAbaco, setPaginaAbaco] = useState("");
  const [exerciciosAbaco, setExerciciosAbaco] = useState("");
  const [errosAbaco, setErrosAbaco] = useState("");
  const [fezDesafio, setFezDesafio] = useState<"sim" | "não">("não");
  const [comentario, setComentario] = useState("");
  const [nivelDesafio, setNivelDesafio] = useState<string>("");
  
  // Novo estado para a data da aula
  const [dataAula, setDataAula] = useState<Date>(new Date());
  const [editandoData, setEditandoData] = useState(false);

  useEffect(() => {
    if (isOpen && aluno) {
      try {
        console.log('ProdutividadeModal: Carregando apostila para aluno:', aluno.nome);
        
        if (aluno.ultimo_nivel) {
          console.log('ProdutividadeModal: Último nível do aluno:', aluno.ultimo_nivel);
          setApostilaAbaco(aluno.ultimo_nivel);
        } else {
          console.log('ProdutividadeModal: Aluno não tem último nível definido');
        }
        
        if (aluno.ultima_pagina) {
          console.log('ProdutividadeModal: Última página do aluno:', aluno.ultima_pagina);
          setPaginaAbaco(aluno.ultima_pagina.toString());
        }
        
        if (aluno.niveldesafio) {
          console.log('ProdutividadeModal: Nível do desafio do aluno:', aluno.niveldesafio);
          setNivelDesafio(aluno.niveldesafio.toString());
        } else {
          setNivelDesafio("1"); // Valor padrão
        }
      } catch (error) {
        console.error('ProdutividadeModal: Erro ao carregar apostila:', error);
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
      setNivelDesafio("");
      setDataAula(new Date());
      setEditandoData(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (presente === "sim" && !apostilaAbaco && !aluno.ultimo_nivel) {
      toast({
        title: "Erro",
        description: "Selecione a apostila do ábaco",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Formatar data para o formato ISO (YYYY-MM-DD)
      const dataAulaFormatada = dataAula.toISOString().split('T')[0];

      // Preparar os dados para enviar para a Edge Function
      const produtividadeData = {
        aluno_id: aluno.id,
        aluno_nome: aluno.nome,
        turma_id: turma.id,
        turma_nome: turma.nome,
        presente: presente === "sim",
        motivo_falta: presente === "não" ? motivoFalta : undefined,
        apostila_abaco: presente === "sim" ? apostilaAbaco : undefined,
        pagina_abaco: presente === "sim" ? paginaAbaco : undefined,
        exercicios_abaco: presente === "sim" ? exerciciosAbaco : undefined,
        erros_abaco: presente === "sim" ? errosAbaco : undefined,
        fez_desafio: presente === "sim" ? fezDesafio === "sim" : undefined,
        nivel_desafio: presente === "sim" && fezDesafio === "sim" ? nivelDesafio : undefined,
        comentario: presente === "sim" ? comentario : undefined,
        data_registro: new Date().toISOString().split('T')[0], // Data em que o registro está sendo feito (hoje)
        data_aula: dataAulaFormatada, // Data da aula que pode ser diferente da data do registro
        data_ultima_correcao_ah: new Date().toISOString(),
        apostila_atual: presente === "sim" ? apostilaAbaco : aluno.ultimo_nivel, // Enviar a apostila atual selecionada
        ultima_pagina: presente === "sim" ? paginaAbaco : aluno.ultima_pagina?.toString(), // Enviar a página atual selecionada
        is_reposicao: false
      };

      console.log('ProdutividadeModal: Enviando dados para register-productivity:', produtividadeData);

      const { data, error } = await supabase.functions.invoke('register-productivity', {
        body: { data: produtividadeData }
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('ProdutividadeModal: Resposta da Edge Function:', data);

      if (data && data.webhookError) {
        toast({
          title: "Parcialmente concluído",
          description: data.message || "Dados salvos, mas não sincronizados com webhook externo.",
          variant: "default"
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Produtividade registrada com sucesso!",
        });
      }

      if (onSuccess) {
        onSuccess(aluno.id);
      }
      
      onClose();
    } catch (error) {
      console.error("ProdutividadeModal: Erro ao registrar produtividade:", error);
      
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
              {/* Seletor de data da aula */}
              <div className="bg-muted/30 p-3 rounded-md">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-medium">Data da aula:</p>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setEditandoData(!editandoData)}
                    className="h-8 px-2 text-xs"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Alterar data
                  </Button>
                </div>
                
                {editandoData ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(dataAula, "dd 'de' MMMM 'de' yyyy", { locale: pt })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dataAula}
                        onSelect={(date) => {
                          if (date) {
                            setDataAula(date);
                            setEditandoData(false);
                          }
                        }}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <div className="bg-background border rounded-md px-3 py-2">
                    {format(dataAula, "dd 'de' MMMM 'de' yyyy", { locale: pt })}
                  </div>
                )}
              </div>
              
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
                    nivelDesafio={nivelDesafio}
                    setNivelDesafio={setNivelDesafio}
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

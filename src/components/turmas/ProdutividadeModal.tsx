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
import { calcularPaginasRestantes } from './utils/paginasUtils';
import { ScrollArea } from "@/components/ui/scroll-area";

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

  const registrarPresencaNoSupabase = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Você precisa estar autenticado para registrar presença');
      }

      const dataHoje = new Date().toISOString().split('T')[0];
      
      const { data: registrosExistentes, error: errorVerificacao } = await supabase
        .from('presencas')
        .select('*')
        .eq('aluno_id', aluno.id)
        .eq('data_aula', dataHoje);
        
      if (errorVerificacao) {
        throw errorVerificacao;
      }
      
      if (registrosExistentes && registrosExistentes.length > 0) {
        const { error: errorAtualizacao } = await supabase
          .from('presencas')
          .update({
            presente: presente === "sim",
            observacao: presente === "sim" ? comentario : motivoFalta
          })
          .eq('id', registrosExistentes[0].id);
          
        if (errorAtualizacao) {
          throw errorAtualizacao;
        }
      } else {
        const { error: errorInsercao } = await supabase
          .from('presencas')
          .insert({
            aluno_id: aluno.id,
            presente: presente === "sim",
            data_aula: dataHoje,
            observacao: presente === "sim" ? comentario : motivoFalta
          });
          
        if (errorInsercao) {
          throw errorInsercao;
        }
      }
      
      if (presente === "não") {
        const { data: faltasExistentes, error: errorFaltas } = await supabase
          .from('faltas_alunos')
          .select('*')
          .eq('aluno_id', aluno.id)
          .eq('data_falta', dataHoje);
          
        if (errorFaltas) {
          throw errorFaltas;
        }
        
        if (faltasExistentes && faltasExistentes.length === 0) {
          const { error: errorInserirFalta } = await supabase
            .from('faltas_alunos')
            .insert({
              aluno_id: aluno.id,
              data_falta: dataHoje,
              motivo: motivoFalta
            });
            
          if (errorInserirFalta) {
            throw errorInserirFalta;
          }
        } else {
          const { error: errorAtualizarFalta } = await supabase
            .from('faltas_alunos')
            .update({
              motivo: motivoFalta
            })
            .eq('id', faltasExistentes[0].id);
            
          if (errorAtualizarFalta) {
            throw errorAtualizarFalta;
          }
        }
      }
      
      if (presente === "sim" && apostilaAbaco && paginaAbaco) {
        const { error: errorAtualizarAluno } = await supabase
          .from('alunos')
          .update({
            apostila_atual: apostilaAbaco,
            ultima_pagina: paginaAbaco
          })
          .eq('id', aluno.id);
          
        if (errorAtualizarAluno) {
          throw errorAtualizarAluno;
        }
      }
      
      return true;
    } catch (error) {
      console.error("Erro ao registrar presença:", error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Você precisa estar autenticado para registrar produtividade');
      }

      if (presente === "sim" && !apostilaAbaco) {
        toast({
          title: "Erro",
          description: "Selecione a apostila do ábaco",
          variant: "destructive"
        });
        return;
      }

      setIsSubmitting(true);
      
      const presencaRegistrada = await registrarPresencaNoSupabase();
      
      if (!presencaRegistrada) {
        throw new Error("Falha ao registrar presença");
      }

      const paginasRestantes = await calcularPaginasRestantes(apostilaAbaco, paginaAbaco);
      
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
        comentario: presente === "sim" ? comentario : undefined,
        data_registro: new Date().toISOString(),
        data_ultima_correcao_ah: presente === "sim" ? new Date().toISOString() : undefined,
        apostila_atual: presente === "sim" ? apostilaAbaco : undefined,
        ultima_pagina: presente === "sim" ? paginaAbaco : undefined,
        paginas_restantes: paginasRestantes,
      };

      const { data, error } = await supabase.functions.invoke('register-productivity', {
        body: { data: produtividadeData }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data && data.googleSheetsError) {
        toast({
          title: "Parcialmente concluído",
          description: data.message || "Dados salvos, mas não sincronizados com Google Sheets.",
          variant: "default"
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Produtividade registrada com sucesso",
        });
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
            <AlunoProgressoCard 
              ultimo_nivel={aluno.ultimo_nivel}
              ultimaPaginaCorrigida={aluno.ultima_pagina}
              paginasRestantes={aluno.paginas_restantes}
              ultimaCorrecaoAH={aluno.ultima_correcao_ah}
              alunoId={aluno.id}
            />
            
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

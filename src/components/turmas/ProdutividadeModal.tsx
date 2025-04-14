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

  useEffect(() => {
    if (isOpen && aluno && aluno.ultimo_nivel) {
      const apostilaSugerida = encontrarApostilaMaisProxima(aluno.ultimo_nivel);
      setApostilaAbaco(apostilaSugerida);
      
      // Preencher com os dados atuais se disponíveis
      if (aluno.ultimo_nivel) {
        setApostilaAbaco(aluno.ultimo_nivel);
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
      
      // Se o aluno faltou, registrar na tabela de faltas
      if (presente === "não") {
        // Primeiro verificar se já existe um registro de falta para hoje
        const { data: faltasExistentes, error: errorFaltas } = await supabase
          .from('faltas_alunos')
          .select('*')
          .eq('aluno_id', aluno.id)
          .eq('data_falta', dataHoje);
          
        if (errorFaltas) {
          throw errorFaltas;
        }
        
        if (faltasExistentes && faltasExistentes.length === 0) {
          // Não existe falta registrada, então inserir
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
          // Atualizar o registro existente
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
      
      // Atualizar a apostila e página atual do aluno
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
      
      const presencaRegistrada = await registrarPresencaNoSupabase();
      
      if (!presencaRegistrada) {
        throw new Error("Falha ao registrar presença");
      }
      
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
      };

      const { data, error } = await supabase.functions.invoke('register-productivity', {
        body: { data: produtividadeData }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Verificar se os dados foram salvos no banco, mas houve erro no Google Sheets
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
        
        if (error.message.includes("credenciais do Google") || 
            error.message.includes("Google Service Account")) {
          errorMessage = "Configuração incompleta: O sistema precisa das credenciais do Google Service Account";
        }
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
        
        <AlunoProgressoCard 
          apostilaAtual={aluno.apostila_atual || aluno.ultimo_nivel}
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
      </DialogContent>
    </Dialog>
  );
};

export default ProdutividadeModal;

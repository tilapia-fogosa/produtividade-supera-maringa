
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

// Importar componentes refatorados
import PresencaSection from './produtividade/PresencaSection';
import AbacoSection from './produtividade/AbacoSection';
import { encontrarApostilaMaisProxima } from './utils/apostilasUtils';

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

  // Estado principal do formulário
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [presente, setPresente] = useState<"sim" | "não">("sim");
  const [motivoFalta, setMotivoFalta] = useState("");
  
  // Campos do ábaco (quando presente)
  const [apostilaAbaco, setApostilaAbaco] = useState("");
  const [paginaAbaco, setPaginaAbaco] = useState("");
  const [exerciciosAbaco, setExerciciosAbaco] = useState("");
  const [errosAbaco, setErrosAbaco] = useState("");
  const [fezDesafio, setFezDesafio] = useState<"sim" | "não">("não");
  const [comentario, setComentario] = useState("");

  // Pré-selecionar a apostila de ábaco com base no último nível do aluno
  useEffect(() => {
    if (isOpen && aluno && aluno.ultimo_nivel) {
      const apostilaSugerida = encontrarApostilaMaisProxima(aluno.ultimo_nivel);
      setApostilaAbaco(apostilaSugerida);
    }
  }, [isOpen, aluno]);

  // Reset form quando o modal fecha
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
      
      // Verificar se já existe registro para este aluno hoje
      const { data: registrosExistentes, error: errorVerificacao } = await supabase
        .from('presencas')
        .select('*')
        .eq('aluno_id', aluno.id)
        .eq('data_aula', dataHoje);
        
      if (errorVerificacao) {
        throw errorVerificacao;
      }
      
      // Se já existir um registro, atualizar em vez de inserir
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
        // Inserir novo registro
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
      
      // Primeiro registrar a presença
      const presencaRegistrada = await registrarPresencaNoSupabase();
      
      if (!presencaRegistrada) {
        throw new Error("Falha ao registrar presença");
      }
      
      // Preparar dados para enviar
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
      };

      // Enviar para a função Edge
      const { data, error } = await supabase.functions.invoke('register-productivity', {
        body: { data: produtividadeData }
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Sucesso",
        description: "Produtividade registrada com sucesso",
      });
      
      // Notificar o componente pai do sucesso
      if (onSuccess) {
        onSuccess(aluno.id);
      }
      
      onClose();
    } catch (error) {
      console.error("Erro ao registrar produtividade:", error);
      
      // Extrair a mensagem de erro
      let errorMessage = "Não foi possível registrar a produtividade. Tente novamente.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Verificar se é um erro relacionado às credenciais do Google
        if (error.message.includes("credenciais do Google") || 
            error.message.includes("Google Service Account")) {
          errorMessage = "Configuração incompleta: O sistema precisa das credenciais do Google Service Account";
        }
      }
      
      // Notificar o componente pai do erro
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
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Presença */}
          <PresencaSection 
            presente={presente}
            setPresente={setPresente}
            motivoFalta={motivoFalta}
            setMotivoFalta={setMotivoFalta}
          />
          
          {/* Campos para alunos presentes */}
          {presente === "sim" && (
            <>
              {/* Ábaco */}
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

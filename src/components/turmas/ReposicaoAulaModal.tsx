
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
import { Turma } from '@/hooks/use-professor-turmas';
import { PessoaTurma } from '@/hooks/use-pessoas-turma';
import { Input } from "@/components/ui/input";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { useApostilas } from '@/hooks/use-apostilas';
import PresencaSection from './produtividade/PresencaSection';
import AbacoSection from './produtividade/AbacoSection';
import AlunoProgressoCard from './produtividade/AlunoProgressoCard';
import { ScrollArea } from "@/components/ui/scroll-area";

interface ReposicaoAulaModalProps {
  isOpen: boolean;
  turma: Turma;
  todosAlunos: PessoaTurma[];
  onClose: () => void;
  onError?: (errorMessage: string) => void;
}

interface FormValues {
  pessoaId: string;
  presente: "sim" | "não";
  motivoFalta: string;
  apostilaAbaco: string;
  paginaAbaco: string;
  exerciciosAbaco: string;
  errosAbaco: string;
  fezDesafio: "sim" | "não";
  comentario: string;
  nivelDesafio: string;
}

const ReposicaoAulaModal: React.FC<ReposicaoAulaModalProps> = ({
  isOpen,
  turma,
  todosAlunos,
  onClose,
  onError
}) => {
  const isMobile = useIsMobile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filtro, setFiltro] = useState("");
  const [alunosFiltrados, setAlunosFiltrados] = useState<PessoaTurma[]>(todosAlunos);
  const [pessoaSelecionada, setPessoaSelecionada] = useState<PessoaTurma | null>(null);
  
  const { apostilas: apostilasDisponiveis } = useApostilas();
  
  const form = useForm<FormValues>({
    defaultValues: {
      pessoaId: "",
      presente: "sim",
      motivoFalta: "",
      apostilaAbaco: "",
      paginaAbaco: "",
      exerciciosAbaco: "",
      errosAbaco: "",
      fezDesafio: "não",
      comentario: "",
      nivelDesafio: "1"
    }
  });

  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setFiltro("");
      setPessoaSelecionada(null);
    }
  }, [isOpen, form]);
  
  useEffect(() => {
    if (filtro) {
      const filtered = todosAlunos.filter(pessoa => 
        pessoa.nome.toLowerCase().includes(filtro.toLowerCase())
      );
      setAlunosFiltrados(filtered);
    } else {
      setAlunosFiltrados(todosAlunos);
    }
  }, [filtro, todosAlunos]);

  useEffect(() => {
    const pessoaId = form.watch("pessoaId");
    if (pessoaId) {
      const pessoa = todosAlunos.find(p => p.id === pessoaId);
      if (pessoa) {
        setPessoaSelecionada(pessoa);
        
        if (pessoa.ultimo_nivel) {
          form.setValue("apostilaAbaco", pessoa.ultimo_nivel);
        }
        
        if (pessoa.niveldesafio) {
          form.setValue("nivelDesafio", pessoa.niveldesafio.toString());
        } else {
          form.setValue("nivelDesafio", "1");
        }
      } else {
        setPessoaSelecionada(null);
      }
    } else {
      setPessoaSelecionada(null);
    }
  }, [form.watch("pessoaId"), todosAlunos, form]);
  
  const handleSubmit = async (values: FormValues) => {
    if (!values.pessoaId) {
      toast({
        title: "Erro",
        description: "Selecione uma pessoa para registrar a reposição",
        variant: "destructive"
      });
      return;
    }
    
    const pessoaSelecionada = todosAlunos.find(p => p.id === values.pessoaId);
    
    if (!pessoaSelecionada) {
      toast({
        title: "Erro",
        description: "Pessoa não encontrada",
        variant: "destructive"
      });
      return;
    }
    
    if (values.presente === "sim" && !values.apostilaAbaco && !pessoaSelecionada.ultimo_nivel) {
      toast({
        title: "Erro",
        description: "Selecione a apostila do ábaco",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const produtividadeData = {
        aluno_id: values.pessoaId, // Backend ainda espera aluno_id, será convertido para pessoa_id
        aluno_nome: pessoaSelecionada.nome,
        turma_id: turma.id,
        turma_nome: turma.nome,
        presente: values.presente === "sim",
        motivo_falta: values.presente === "não" ? values.motivoFalta : undefined,
        apostila_abaco: values.presente === "sim" ? values.apostilaAbaco : undefined,
        pagina_abaco: values.presente === "sim" ? values.paginaAbaco : undefined,
        exercicios_abaco: values.presente === "sim" ? values.exerciciosAbaco : undefined,
        erros_abaco: values.presente === "sim" ? values.errosAbaco : undefined,
        fez_desafio: values.presente === "sim" ? values.fezDesafio === "sim" : undefined,
        nivel_desafio: values.presente === "sim" && values.fezDesafio === "sim" ? values.nivelDesafio : undefined,
        comentario: values.presente === "sim" ? values.comentario : undefined,
        data_registro: new Date().toISOString(),
        apostila_atual: pessoaSelecionada.ultimo_nivel,
        ultima_pagina: pessoaSelecionada.ultima_pagina?.toString(),
        is_reposicao: true,
        tipo_pessoa: pessoaSelecionada.origem // Adicionar tipo de pessoa
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
          description: "Reposição de aula registrada com sucesso",
        });
      }
      
      onClose();
    } catch (error) {
      console.error("Erro ao registrar reposição:", error);
      
      let errorMessage = "Não foi possível registrar a reposição. Tente novamente.";
      
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

  const presente = form.watch("presente");
  const pessoaId = form.watch("pessoaId");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`max-w-md ${isMobile ? "w-[95%] p-4" : ""} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className={isMobile ? "text-lg" : ""}>
            Registrar Reposição de Aula
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-2">
              <div className="space-y-2">
                <FormLabel>Selecione a Pessoa</FormLabel>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Pesquisar pessoa..."
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    className="pl-8"
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="pessoaId"
                  render={({ field }) => (
                    <FormItem>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma pessoa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-60">
                          {alunosFiltrados.length === 0 ? (
                            <div className="py-2 px-2 text-sm text-gray-500 text-center">
                              Nenhuma pessoa encontrada
                            </div>
                          ) : (
                            alunosFiltrados.map((pessoa) => (
                              <SelectItem key={pessoa.id} value={pessoa.id}>
                                {pessoa.nome} {pessoa.codigo ? `(${pessoa.codigo})` : ''} - {pessoa.origem === 'funcionario' ? 'Funcionário' : 'Aluno'}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              
              {pessoaId && (
                <div className="pt-2">
                  <AlunoProgressoCard alunoId={pessoaId} />
                </div>
              )}
              
              <FormField
                control={form.control}
                name="presente"
                render={({ field }) => (
                  <FormItem>
                    <PresencaSection 
                      presente={field.value}
                      setPresente={(value) => field.onChange(value)}
                      motivoFalta={form.watch("motivoFalta")}
                      setMotivoFalta={(value) => form.setValue("motivoFalta", value)}
                      alunoId={pessoaId}
                    />
                  </FormItem>
                )}
              />
              
              {presente === "sim" && (
                <>
                  <FormField
                    control={form.control}
                    name="apostilaAbaco"
                    render={({ field }) => (
                      <AbacoSection 
                        apostilaAbaco={field.value}
                        setApostilaAbaco={(value) => field.onChange(value)}
                        paginaAbaco={form.watch("paginaAbaco")}
                        setPaginaAbaco={(value) => form.setValue("paginaAbaco", value)}
                        exerciciosAbaco={form.watch("exerciciosAbaco")}
                        setExerciciosAbaco={(value) => form.setValue("exerciciosAbaco", value)}
                        errosAbaco={form.watch("errosAbaco")}
                        setErrosAbaco={(value) => form.setValue("errosAbaco", value)}
                        fezDesafio={form.watch("fezDesafio")}
                        setFezDesafio={(value) => form.setValue("fezDesafio", value)}
                        comentario={form.watch("comentario")}
                        setComentario={(value) => form.setValue("comentario", value)}
                        nivelDesafio={form.watch("nivelDesafio")}
                        setNivelDesafio={(value) => form.setValue("nivelDesafio", value)}
                      />
                    )}
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
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ReposicaoAulaModal;

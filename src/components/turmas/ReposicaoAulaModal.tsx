
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

// Import reused sections
import PresencaSection from './produtividade/PresencaSection';
import AbacoSection from './produtividade/AbacoSection';

interface ReposicaoAulaModalProps {
  isOpen: boolean;
  turma: Turma;
  todosAlunos: Aluno[];
  onClose: () => void;
  onError?: (errorMessage: string) => void;
}

interface FormValues {
  alunoId: string;
  presente: "sim" | "não";
  motivoFalta: string;
  apostilaAbaco: string;
  paginaAbaco: string;
  exerciciosAbaco: string;
  errosAbaco: string;
  fezDesafio: "sim" | "não";
  comentario: string;
}

interface Apostila {
  nome: string;
  total_paginas: number;
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
  const [alunosFiltrados, setAlunosFiltrados] = useState<Aluno[]>(todosAlunos);
  const [apostilas, setApostilas] = useState<Apostila[]>([]);
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  
  const form = useForm<FormValues>({
    defaultValues: {
      alunoId: "",
      presente: "sim",
      motivoFalta: "",
      apostilaAbaco: "",
      paginaAbaco: "",
      exerciciosAbaco: "",
      errosAbaco: "",
      fezDesafio: "não",
      comentario: ""
    }
  });
  
  // Buscar apostilas do banco de dados
  useEffect(() => {
    const fetchApostilas = async () => {
      const { data, error } = await supabase
        .from('apostilas')
        .select('nome, total_paginas')
        .order('nome');
        
      if (error) {
        console.error("Erro ao buscar apostilas:", error);
        return;
      }
      
      if (data) {
        setApostilas(data);
      }
    };
    
    fetchApostilas();
  }, []);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setFiltro("");
      setAlunoSelecionado(null);
    }
  }, [isOpen, form]);
  
  // Filter students by name as user types
  useEffect(() => {
    if (filtro) {
      const filtered = todosAlunos.filter(aluno => 
        aluno.nome.toLowerCase().includes(filtro.toLowerCase())
      );
      setAlunosFiltrados(filtered);
    } else {
      setAlunosFiltrados(todosAlunos);
    }
  }, [filtro, todosAlunos]);

  // Atualizar apostila selecionada quando o aluno mudar
  useEffect(() => {
    const alunoId = form.watch("alunoId");
    if (alunoId) {
      const aluno = todosAlunos.find(a => a.id === alunoId);
      if (aluno) {
        setAlunoSelecionado(aluno);
        
        // Se o aluno tiver uma apostila atual, selecionar ela no formulário
        if (aluno.apostila_atual) {
          form.setValue("apostilaAbaco", aluno.apostila_atual);
        }
      }
    }
  }, [form.watch("alunoId"), todosAlunos, form]);
  
  const handleSubmit = async (values: FormValues) => {
    if (!values.alunoId) {
      toast({
        title: "Erro",
        description: "Selecione um aluno para registrar a reposição",
        variant: "destructive"
      });
      return;
    }
    
    if (values.presente === "sim" && !values.apostilaAbaco) {
      toast({
        title: "Erro",
        description: "Selecione a apostila do ábaco",
        variant: "destructive"
      });
      return;
    }

    // Find the selected student to get their name
    const alunoSelecionado = todosAlunos.find(a => a.id === values.alunoId);
    
    if (!alunoSelecionado) {
      toast({
        title: "Erro",
        description: "Aluno não encontrado",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Prepare data for submission
      const produtividadeData = {
        aluno_id: values.alunoId,
        aluno_nome: alunoSelecionado.nome,
        turma_id: turma.id,
        turma_nome: turma.nome,
        presente: values.presente === "sim",
        motivo_falta: values.presente === "não" ? values.motivoFalta : undefined,
        apostila_abaco: values.presente === "sim" ? values.apostilaAbaco : undefined,
        pagina_abaco: values.presente === "sim" ? values.paginaAbaco : undefined,
        exercicios_abaco: values.presente === "sim" ? values.exerciciosAbaco : undefined,
        erros_abaco: values.presente === "sim" ? values.errosAbaco : undefined,
        fez_desafio: values.presente === "sim" ? values.fezDesafio === "sim" : undefined,
        comentario: values.presente === "sim" ? values.comentario : undefined,
        data_registro: new Date().toISOString(),
        is_reposicao: true
      };

      // Send to Edge function
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
          description: "Reposição de aula registrada com sucesso",
        });
      }
      
      onClose();
    } catch (error) {
      console.error("Erro ao registrar reposição:", error);
      
      // Extrair a mensagem de erro
      let errorMessage = "Não foi possível registrar a reposição. Tente novamente.";
      
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

  const presente = form.watch("presente");
  const alunoId = form.watch("alunoId");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`max-w-md ${isMobile ? "w-[95%] p-4" : ""} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className={isMobile ? "text-lg" : ""}>
            Registrar Reposição de Aula
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-2">
            {/* Seleção de Aluno */}
            <div className="space-y-2">
              <FormLabel>Selecione o Aluno</FormLabel>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Pesquisar aluno..."
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              <FormField
                control={form.control}
                name="alunoId"
                render={({ field }) => (
                  <FormItem>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um aluno" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60">
                        {alunosFiltrados.length === 0 ? (
                          <div className="py-2 px-2 text-sm text-gray-500 text-center">
                            Nenhum aluno encontrado
                          </div>
                        ) : (
                          alunosFiltrados.map((aluno) => (
                            <SelectItem key={aluno.id} value={aluno.id}>
                              {aluno.nome} {aluno.codigo ? `(${aluno.codigo})` : ''}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            
            {/* Presença */}
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
                    alunoId={alunoId}
                  />
                </FormItem>
              )}
            />
            
            {/* Campos para alunos presentes */}
            {presente === "sim" && (
              <>
                {/* Ábaco */}
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
                      apostilas={apostilas}
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
      </DialogContent>
    </Dialog>
  );
};

export default ReposicaoAulaModal;

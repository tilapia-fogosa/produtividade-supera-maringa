
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Pen } from 'lucide-react';
import { APOSTILAS_AH, PROFESSORES } from '../constants/apostilas';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Aluno } from "@/hooks/use-professor-turmas";
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AbindoHorizontesScreenProps {
  onBackToMenu: () => void;
  alunos: Aluno[]; // Adicionado prop alunos
}

// Schema para validação do formulário
const ahFormSchema = z.object({
  aluno: z.string().min(1, { message: "Selecione um aluno" }),
  apostila: z.string().min(1, { message: "Selecione uma apostila" }),
  exercicios: z.string().min(1, { message: "Informe o número de exercícios" }),
  erros: z.string().min(1, { message: "Informe o número de erros" }),
  professor: z.string().min(1, { message: "Selecione o professor" }),
  comentario: z.string().optional()
});

type AhFormValues = z.infer<typeof ahFormSchema>;

const AbindoHorizontesScreen: React.FC<AbindoHorizontesScreenProps> = ({ onBackToMenu, alunos }) => {
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null);
  
  // Inicializar o formulário com validação
  const form = useForm<AhFormValues>({
    resolver: zodResolver(ahFormSchema),
    defaultValues: {
      aluno: "",
      apostila: "",
      exercicios: "",
      erros: "",
      professor: "",
      comentario: ""
    }
  });

  // Quando aluno é selecionado
  const handleAlunoChange = (value: string) => {
    const aluno = alunos.find(a => a.id === value);
    setSelectedAluno(aluno || null);
    form.setValue("aluno", value);
  };

  // Enviar o formulário
  const onSubmit = async (values: AhFormValues) => {
    try {
      setIsLoading(true);
      
      const dataHoje = new Date().toISOString().split('T')[0];
      
      // Preparar dados para o banco
      const produtividadeData = {
        aluno_id: values.aluno,
        data_aula: dataHoje,
        presente: true,
        is_reposicao: false,
        apostila: values.apostila,
        exercicios: parseInt(values.exercicios),
        erros: parseInt(values.erros),
        professor_correcao: values.professor,
        comentario: values.comentario || null
      };
      
      // Salvar no banco
      const { error } = await supabase
        .from('produtividade_ah')
        .insert(produtividadeData);
        
      if (error) throw error;
      
      // Atualizar a data da última correção AH do aluno
      await supabase
        .from('alunos')
        .update({ ultima_correcao_ah: new Date().toISOString() })
        .eq('id', values.aluno);
      
      toast({
        title: "Sucesso",
        description: "Lançamento de Abrindo Horizontes registrado com sucesso!",
      });
      
      // Resetar o formulário
      form.reset();
      setSelectedAluno(null);
      
    } catch (error) {
      console.error('Erro ao lançar AH:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar o lançamento",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="py-2">
      <ScrollArea className="max-h-[80vh] pr-4">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="aluno">Aluno</Label>
            <Select 
              onValueChange={handleAlunoChange}
              value={form.watch("aluno")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o aluno" />
              </SelectTrigger>
              <SelectContent>
                {alunos.map((aluno) => (
                  <SelectItem key={aluno.id} value={aluno.id}>
                    {aluno.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.aluno && (
              <p className="text-destructive text-sm">{form.formState.errors.aluno.message}</p>
            )}
          </div>
          
          {selectedAluno && (
            <>
              <div className="space-y-2">
                <Label htmlFor="apostila">Apostila AH</Label>
                <Select 
                  onValueChange={(value) => form.setValue("apostila", value)}
                  value={form.watch("apostila")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a apostila" />
                  </SelectTrigger>
                  <SelectContent>
                    {APOSTILAS_AH.map((apostila) => (
                      <SelectItem key={apostila} value={apostila}>
                        {apostila}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.apostila && (
                  <p className="text-destructive text-sm">{form.formState.errors.apostila.message}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exercicios">Exercícios realizados</Label>
                  <Input
                    id="exercicios"
                    type="number"
                    {...form.register("exercicios")}
                    placeholder="Quantidade"
                  />
                  {form.formState.errors.exercicios && (
                    <p className="text-destructive text-sm">{form.formState.errors.exercicios.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="erros">Erros</Label>
                  <Input
                    id="erros"
                    type="number"
                    {...form.register("erros")}
                    placeholder="Quantidade"
                  />
                  {form.formState.errors.erros && (
                    <p className="text-destructive text-sm">{form.formState.errors.erros.message}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="professor">Professor que corrigiu</Label>
                <Select 
                  onValueChange={(value) => form.setValue("professor", value)}
                  value={form.watch("professor")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o professor" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROFESSORES.map((professor) => (
                      <SelectItem key={professor} value={professor}>
                        <div className="flex items-center">
                          <Pen className="mr-2 h-4 w-4" />
                          {professor}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.professor && (
                  <p className="text-destructive text-sm">{form.formState.errors.professor.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="comentario">Comentário (opcional)</Label>
                <Input
                  id="comentario"
                  {...form.register("comentario")}
                  placeholder="Observações adicionais"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full mt-4 bg-supera hover:bg-supera-600 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Salvando..." : "Salvar Lançamento"}
              </Button>
            </>
          )}
        </form>
      </ScrollArea>
    </div>
  );
};

export default AbindoHorizontesScreen;

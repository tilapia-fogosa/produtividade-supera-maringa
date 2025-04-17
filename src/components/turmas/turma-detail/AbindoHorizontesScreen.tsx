
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
import { BookText } from 'lucide-react';
import { APOSTILAS_AH } from '../constants/apostilas';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Aluno } from "@/hooks/use-professor-turmas";
import { toast } from '@/hooks/use-toast';
import AlunosAHTable from './AlunosAHTable';
import { useCorretores } from '@/hooks/use-corretores';
import { useAhLancamento } from '@/hooks/use-ah-lancamento';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

interface AbindoHorizontesScreenProps {
  onBackToMenu: () => void;
  alunos: Aluno[];
}

// Schema para validação do formulário
const ahFormSchema = z.object({
  aluno: z.string().min(1, { message: "Selecione um aluno" }),
  apostila: z.string().min(1, { message: "Selecione uma apostila" }),
  exercicios: z.string().min(1, { message: "Informe o número de exercícios" }),
  erros: z.string().min(1, { message: "Informe o número de erros" }),
  corretor: z.string().min(1, { message: "Selecione o corretor" }),
  comentario: z.string().optional()
});

type AhFormValues = z.infer<typeof ahFormSchema>;

const AbindoHorizontesScreen: React.FC<AbindoHorizontesScreenProps> = ({ onBackToMenu, alunos }) => {
  const isMobile = useIsMobile();
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ahRegistrado, setAhRegistrado] = useState<Record<string, boolean>>({});
  
  // Carregar corretores
  const { corretores, isLoading: carregandoCorretores } = useCorretores();
  
  // Hook para lançamento AH
  const { registrarLancamentoAH, isLoading } = useAhLancamento();
  
  // Inicializar o formulário com validação
  const form = useForm<AhFormValues>({
    resolver: zodResolver(ahFormSchema),
    defaultValues: {
      aluno: "",
      apostila: "",
      exercicios: "",
      erros: "",
      corretor: "",
      comentario: ""
    }
  });

  // Quando aluno é selecionado na tabela
  const handleSelecionarAluno = (aluno: Aluno) => {
    setSelectedAluno(aluno);
    
    // Preencher os dados do formulário
    form.setValue("aluno", aluno.id);
    if (aluno.ultimo_nivel) {
      form.setValue("apostila", aluno.ultimo_nivel);
    }
    
    setIsModalOpen(true);
  };

  // Fechar o modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAluno(null);
    form.reset();
  };

  // Enviar o formulário
  const onSubmit = async (values: AhFormValues) => {
    try {
      // Preparar dados para o serviço
      const produtividadeData = {
        aluno_id: values.aluno,
        apostila: values.apostila,
        exercicios: parseInt(values.exercicios),
        erros: parseInt(values.erros),
        professor_correcao: values.corretor,
        comentario: values.comentario || null
      };
      
      // Chamar serviço para registrar lançamento
      const resultado = await registrarLancamentoAH(produtividadeData);
      
      if (resultado) {
        // Atualizar o estado para mostrar que o registro foi feito
        setAhRegistrado(prev => ({
          ...prev,
          [values.aluno]: true
        }));
        
        // Resetar o formulário e fechar o modal
        form.reset();
        setSelectedAluno(null);
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Erro ao lançar AH:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar o lançamento",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="py-2">
      <AlunosAHTable 
        alunos={alunos}
        onSelecionarAluno={handleSelecionarAluno}
        ahRegistrado={ahRegistrado}
      />
      
      {/* Modal para lançamento de AH */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className={`max-w-md ${isMobile ? "w-[95%] p-4" : ""}`}>
          <DialogHeader>
            <DialogTitle className={isMobile ? "text-lg" : ""}>
              Lançar Abrindo Horizontes - {selectedAluno?.nome}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[70vh] pr-4">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <Label htmlFor="corretor">Quem corrigiu</Label>
                <Select 
                  onValueChange={(value) => form.setValue("corretor", value)}
                  value={form.watch("corretor")}
                  disabled={carregandoCorretores}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={carregandoCorretores ? "Carregando..." : "Selecione o corretor"} />
                  </SelectTrigger>
                  <SelectContent>
                    {corretores.map((corretor) => (
                      <SelectItem key={corretor.id} value={corretor.id}>
                        <div className="flex items-center">
                          <BookText className="mr-2 h-4 w-4" />
                          {corretor.nome}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.corretor && (
                  <p className="text-destructive text-sm">{form.formState.errors.corretor.message}</p>
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
              
              <DialogFooter className={isMobile ? "flex-col space-y-2" : ""}>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCloseModal}
                  disabled={isLoading}
                  className={isMobile ? "w-full" : ""}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className={isMobile ? "w-full" : ""}
                >
                  {isLoading ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AbindoHorizontesScreen;

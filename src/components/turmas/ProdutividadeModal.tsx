
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Aluno, Turma } from '@/hooks/use-professor-turmas';
import { Check, Book, X, Pen } from 'lucide-react';

// Lista de professores (hardcoded for now)
const PROFESSORES = [
  "Prof. Daniel",
  "Prof. Fernando",
  "Prof. Luana",
  "Prof. Mariana",
  "Estagiário João",
  "Estagiária Ana"
];

// Lista de apostilas de ábaco
const APOSTILAS_ABACO = [
  "Avaliação",
  "Adição 1",
  "Adição 2",
  "Subtração 1",
  "Subtração 2",
  "Multiplicação 1",
  "Multiplicação 2",
  "Divisão 1",
  "Divisão 2",
  "Números Decimais",
  "Frações",
  "Raiz Quadrada",
  "Avançado"
];

// Lista de apostilas AH
const APOSTILAS_AH = Array.from({ length: 11 }, (_, i) => `AH ${i + 1}`);

interface ProdutividadeModalProps {
  isOpen: boolean;
  aluno: Aluno;
  turma: Turma;
  onClose: () => void;
}

const ProdutividadeModal: React.FC<ProdutividadeModalProps> = ({
  isOpen,
  aluno,
  turma,
  onClose
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
  
  // Campos do AH
  const [lancouAh, setLancouAh] = useState<"sim" | "não">("não");
  const [apostilaAh, setApostilaAh] = useState("");
  const [exerciciosAh, setExerciciosAh] = useState("");
  const [errosAh, setErrosAh] = useState("");
  const [professorCorrecao, setProfessorCorrecao] = useState("");

  // Reset form quando o modal fecha
  React.useEffect(() => {
    if (!isOpen) {
      setPresente("sim");
      setMotivoFalta("");
      setApostilaAbaco("");
      setPaginaAbaco("");
      setExerciciosAbaco("");
      setErrosAbaco("");
      setFezDesafio("não");
      setComentario("");
      setLancouAh("não");
      setApostilaAh("");
      setExerciciosAh("");
      setErrosAh("");
      setProfessorCorrecao("");
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

    if (lancouAh === "sim" && !apostilaAh) {
      toast({
        title: "Erro",
        description: "Selecione a apostila AH",
        variant: "destructive"
      });
      return;
    }

    if (lancouAh === "sim" && !professorCorrecao) {
      toast({
        title: "Erro",
        description: "Selecione o professor que corrigiu",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
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
        lancou_ah: presente === "sim" ? lancouAh === "sim" : undefined,
        apostila_ah: presente === "sim" && lancouAh === "sim" ? apostilaAh : undefined,
        exercicios_ah: presente === "sim" && lancouAh === "sim" ? exerciciosAh : undefined,
        erros_ah: presente === "sim" && lancouAh === "sim" ? errosAh : undefined,
        professor_correcao: presente === "sim" && lancouAh === "sim" ? professorCorrecao : undefined,
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
      
      onClose();
    } catch (error) {
      console.error("Erro ao registrar produtividade:", error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar a produtividade. Tente novamente.",
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
          <div className="space-y-2">
            <Label>Aluno veio à aula?</Label>
            <div className="flex gap-4">
              <RadioGroup value={presente} onValueChange={(v) => setPresente(v as "sim" | "não")} className="flex flex-row gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sim" id="presente-sim" />
                  <Label htmlFor="presente-sim" className="flex items-center">
                    <Check className="mr-1 h-4 w-4 text-green-500" /> Sim
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="não" id="presente-nao" />
                  <Label htmlFor="presente-nao" className="flex items-center">
                    <X className="mr-1 h-4 w-4 text-red-500" /> Não
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          
          {/* Motivo da falta (se não estiver presente) */}
          {presente === "não" && (
            <div className="space-y-2">
              <Label htmlFor="motivo-falta">Motivo da falta (opcional)</Label>
              <Textarea 
                id="motivo-falta" 
                value={motivoFalta} 
                onChange={(e) => setMotivoFalta(e.target.value)}
                className="w-full"
                placeholder="Informe o motivo da falta (opcional)"
              />
            </div>
          )}
          
          {/* Campos para alunos presentes */}
          {presente === "sim" && (
            <>
              {/* Ábaco */}
              <div className="space-y-2">
                <Label htmlFor="apostila-abaco">Apostila do ábaco</Label>
                <Select value={apostilaAbaco} onValueChange={setApostilaAbaco}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a apostila" />
                  </SelectTrigger>
                  <SelectContent>
                    {APOSTILAS_ABACO.map((apostila) => (
                      <SelectItem key={apostila} value={apostila}>
                        <div className="flex items-center">
                          <Book className="mr-2 h-4 w-4" />
                          {apostila}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pagina-abaco">Página do ábaco</Label>
                  <Input
                    id="pagina-abaco"
                    value={paginaAbaco}
                    onChange={(e) => setPaginaAbaco(e.target.value)}
                    placeholder="Página"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="exercicios-abaco">Exercícios realizados</Label>
                  <Input
                    id="exercicios-abaco"
                    value={exerciciosAbaco}
                    onChange={(e) => setExerciciosAbaco(e.target.value)}
                    placeholder="Quantidade"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="erros-abaco">Número de erros</Label>
                <Input
                  id="erros-abaco"
                  value={errosAbaco}
                  onChange={(e) => setErrosAbaco(e.target.value)}
                  placeholder="Quantidade de erros"
                />
              </div>
              
              {/* Fez desafio */}
              <div className="space-y-2">
                <Label>Fez desafio?</Label>
                <RadioGroup value={fezDesafio} onValueChange={(v) => setFezDesafio(v as "sim" | "não")} className="flex flex-row gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="desafio-sim" />
                    <Label htmlFor="desafio-sim">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="não" id="desafio-nao" />
                    <Label htmlFor="desafio-nao">Não</Label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Comentário */}
              <div className="space-y-2">
                <Label htmlFor="comentario">Comentário (opcional)</Label>
                <Textarea
                  id="comentario"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Comentários adicionais"
                  className="w-full"
                />
              </div>
              
              {/* Lançar AH */}
              <div className="space-y-2">
                <Label>Lançar AH?</Label>
                <RadioGroup value={lancouAh} onValueChange={(v) => setLancouAh(v as "sim" | "não")} className="flex flex-row gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="ah-sim" />
                    <Label htmlFor="ah-sim">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="não" id="ah-nao" />
                    <Label htmlFor="ah-nao">Não</Label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Campos para AH quando selecionado */}
              {lancouAh === "sim" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="apostila-ah">Qual apostila AH?</Label>
                    <Select value={apostilaAh} onValueChange={setApostilaAh}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a apostila AH" />
                      </SelectTrigger>
                      <SelectContent>
                        {APOSTILAS_AH.map((apostila) => (
                          <SelectItem key={apostila} value={apostila}>
                            {apostila}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="exercicios-ah">Exercícios realizados</Label>
                      <Input
                        id="exercicios-ah"
                        value={exerciciosAh}
                        onChange={(e) => setExerciciosAh(e.target.value)}
                        placeholder="Quantidade"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="erros-ah">Número de erros</Label>
                      <Input
                        id="erros-ah"
                        value={errosAh}
                        onChange={(e) => setErrosAh(e.target.value)}
                        placeholder="Quantidade"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="professor-correcao">Professor que corrigiu</Label>
                    <Select value={professorCorrecao} onValueChange={setProfessorCorrecao}>
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
                  </div>
                </>
              )}
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


import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookText } from 'lucide-react';
import { APOSTILAS_AH } from '../constants/apostilas';
import { useCorretores } from '@/hooks/use-corretores';

interface AhSectionProps {
  lancouAh: "sim" | "não";
  setLancouAh: (value: "sim" | "não") => void;
  apostilaAh: string;
  setApostilaAh: (value: string) => void;
  exerciciosAh: string;
  setExerciciosAh: (value: string) => void;
  errosAh: string;
  setErrosAh: (value: string) => void;
  professorCorrecao: string;
  setProfessorCorrecao: (value: string) => void;
}

const AhSection: React.FC<AhSectionProps> = ({
  lancouAh,
  setLancouAh,
  apostilaAh,
  setApostilaAh,
  exerciciosAh,
  setExerciciosAh,
  errosAh,
  setErrosAh,
  professorCorrecao,
  setProfessorCorrecao
}) => {
  const { corretores, isLoading: carregandoCorretores } = useCorretores();

  return (
    <>
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
            <Label htmlFor="professor-correcao">Quem corrigiu</Label>
            <Select value={professorCorrecao} onValueChange={setProfessorCorrecao} disabled={carregandoCorretores}>
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
          </div>
        </>
      )}
    </>
  );
};

export default AhSection;

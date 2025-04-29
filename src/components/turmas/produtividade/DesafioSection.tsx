
import React from 'react';
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DesafioSectionProps {
  fezDesafio: "sim" | "não";
  setFezDesafio: (value: "sim" | "não") => void;
  nivelDesafio: string;
  setNivelDesafio: (value: string) => void;
}

const DesafioSection: React.FC<DesafioSectionProps> = ({
  fezDesafio,
  setFezDesafio,
  nivelDesafio,
  setNivelDesafio
}) => {
  const handleDesafioChange = (value: "sim" | "não") => {
    setFezDesafio(value);
  };

  const handleNivelDesafioChange = (nivel: string) => {
    setNivelDesafio(nivel);
  };

  return (
    <div className="space-y-2">
      <Label>Fez desafio?</Label>
      <div className="grid grid-cols-[1fr,1fr] gap-4 items-center">
        <RadioGroup 
          value={fezDesafio} 
          onValueChange={handleDesafioChange} 
          className="flex flex-row gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sim" id="desafio-sim" />
            <Label htmlFor="desafio-sim">Sim</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="não" id="desafio-nao" />
            <Label htmlFor="desafio-nao">Não</Label>
          </div>
        </RadioGroup>

        <div>
          <Label>Nível do desafio</Label>
          <Select 
            value={nivelDesafio} 
            onValueChange={handleNivelDesafioChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione o nível" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Nível 1</SelectItem>
              <SelectItem value="2">Nível 2</SelectItem>
              <SelectItem value="3">Nível 3</SelectItem>
              <SelectItem value="4">Nível 4</SelectItem>
              <SelectItem value="arrepio">Arrepio</SelectItem>
              <SelectItem value="ccl">CCL</SelectItem>
              <SelectItem value="bpa">BPA</SelectItem>
              <SelectItem value="linguagem">Linguagem</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default DesafioSection;

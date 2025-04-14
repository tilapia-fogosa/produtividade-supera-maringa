
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Book } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";

interface AbacoSectionProps {
  apostilaAbaco: string;
  setApostilaAbaco: (value: string) => void;
  paginaAbaco: string;
  setPaginaAbaco: (value: string) => void;
  exerciciosAbaco: string;
  setExerciciosAbaco: (value: string) => void;
  errosAbaco: string;
  setErrosAbaco: (value: string) => void;
  fezDesafio: "sim" | "não";
  setFezDesafio: (value: "sim" | "não") => void;
  comentario: string;
  setComentario: (value: string) => void;
  apostilas: {nome: string, total_paginas: number}[];
}

const AbacoSection: React.FC<AbacoSectionProps> = ({
  apostilaAbaco,
  setApostilaAbaco,
  paginaAbaco,
  setPaginaAbaco,
  exerciciosAbaco,
  setExerciciosAbaco,
  errosAbaco,
  setErrosAbaco,
  fezDesafio,
  setFezDesafio,
  comentario,
  setComentario,
  apostilas
}) => {
  // Obter o total de páginas da apostila selecionada
  const apostilaSelecionada = apostilas.find(a => a.nome === apostilaAbaco);
  const totalPaginas = apostilaSelecionada ? apostilaSelecionada.total_paginas : 40;

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="apostila-abaco">Apostila do ábaco</Label>
        <Select value={apostilaAbaco} onValueChange={setApostilaAbaco}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a apostila" />
          </SelectTrigger>
          <SelectContent>
            <ScrollArea className="h-[200px]">
              {apostilas.map((apostila) => (
                <SelectItem key={apostila.nome} value={apostila.nome}>
                  <div className="flex items-center">
                    <Book className="mr-2 h-4 w-4" />
                    {apostila.nome} ({apostila.total_paginas} págs)
                  </div>
                </SelectItem>
              ))}
            </ScrollArea>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pagina-abaco">Página do ábaco</Label>
          <Input
            id="pagina-abaco"
            type="number"
            min="1"
            max={totalPaginas}
            value={paginaAbaco}
            onChange={(e) => setPaginaAbaco(e.target.value)}
            placeholder={`Página (1-${totalPaginas})`}
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
    </>
  );
};

export default AbacoSection;

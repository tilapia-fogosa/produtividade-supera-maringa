
import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Book, AlertCircle } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { APOSTILAS_ABACO_DETALHES } from '../constants/apostilas';
import { obterInfoApostila } from '../utils/apostilasUtils';
import { supabase } from "@/integrations/supabase/client";

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
  apostilas: {nome: string, paginas: number}[];
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
  setComentario
}) => {
  const [totalPaginas, setTotalPaginas] = useState(40);
  const [carregandoApostila, setCarregandoApostila] = useState(false);
  const [erroApostila, setErroApostila] = useState<string | null>(null);
  const [apostilasDisponiveis, setApostilasDisponiveis] = useState<{nome: string, total_paginas: number}[]>([]);
  
  // Carregar apostilas disponíveis do banco
  useEffect(() => {
    const carregarApostilasDisponiveis = async () => {
      try {
        // Buscar apostilas diretamente do banco
        const { data: apostilasDB, error } = await supabase
          .from('apostilas')
          .select('nome, total_paginas')
          .order('nome');
          
        if (error) {
          console.error('Erro ao buscar apostilas:', error);
          return;
        }
        
        if (apostilasDB && apostilasDB.length > 0) {
          console.log('Apostilas disponíveis no banco:', apostilasDB);
          setApostilasDisponiveis(apostilasDB);
        } else {
          // Se não encontrou no banco, usa a constante local
          console.log('Usando apostilas locais:', APOSTILAS_ABACO_DETALHES);
          setApostilasDisponiveis(APOSTILAS_ABACO_DETALHES.map(a => ({ 
            nome: a.nome, 
            total_paginas: typeof a.paginas === 'number' ? a.paginas : parseInt(a.paginas as any, 10) || 40
          })));
        }
      } catch (err) {
        console.error('Erro ao carregar apostilas:', err);
      }
    };
    
    carregarApostilasDisponiveis();
  }, []);

  // Buscar o total de páginas da apostila selecionada quando ela mudar
  useEffect(() => {
    const buscarTotalPaginas = async () => {
      if (apostilaAbaco) {
        setCarregandoApostila(true);
        setErroApostila(null);
        
        try {
          // Primeiro, tentar encontrar no banco carregado
          const apostilaNoCache = apostilasDisponiveis.find(a => a.nome === apostilaAbaco);
          
          if (apostilaNoCache) {
            // Se encontrou no cache, use diretamente
            console.log(`Apostila ${apostilaAbaco} encontrada no cache com ${apostilaNoCache.total_paginas} páginas`);
            setTotalPaginas(Number(apostilaNoCache.total_paginas));
          } else {
            // Se não encontrou no cache, busca diretamente do banco
            console.log(`Buscando apostila ${apostilaAbaco} diretamente do banco`);
            const { data: apostilaDB, error } = await supabase
              .from('apostilas')
              .select('nome, total_paginas')
              .eq('nome', apostilaAbaco)
              .maybeSingle();
              
            if (error) {
              throw error;
            }
            
            if (apostilaDB) {
              console.log(`Apostila ${apostilaAbaco} encontrada no banco com ${apostilaDB.total_paginas} páginas`);
              setTotalPaginas(Number(apostilaDB.total_paginas));
            } else {
              // Último recurso: usar a função obterInfoApostila
              const infoApostila = await obterInfoApostila(apostilaAbaco);
              console.log(`Apostila ${apostilaAbaco} via obterInfoApostila com ${infoApostila.total_paginas} páginas`);
              setTotalPaginas(Number(infoApostila.total_paginas));
            }
          }
        } catch (error) {
          console.error('Erro ao buscar informações da apostila:', error);
          setErroApostila('Não foi possível obter as informações da apostila');
        } finally {
          setCarregandoApostila(false);
        }
      }
    };
    
    buscarTotalPaginas();
  }, [apostilaAbaco, apostilasDisponiveis]);

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
              {apostilasDisponiveis.map((apostila) => (
                <SelectItem key={apostila.nome} value={apostila.nome}>
                  <div className="flex items-center">
                    <Book className="mr-2 h-4 w-4" />
                    {apostila.nome} ({apostila.total_paginas} páginas)
                  </div>
                </SelectItem>
              ))}
            </ScrollArea>
          </SelectContent>
        </Select>
        
        {carregandoApostila && (
          <div className="text-xs text-gray-500 mt-1">
            Carregando informações da apostila...
          </div>
        )}
        
        {erroApostila && (
          <div className="flex items-center text-red-500 text-xs mt-1">
            <AlertCircle className="h-3 w-3 mr-1" />
            {erroApostila}
          </div>
        )}
        
        {apostilaAbaco && !carregandoApostila && !erroApostila && (
          <div className="text-xs text-gray-500 mt-1">
            Total de páginas: {totalPaginas}
          </div>
        )}
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

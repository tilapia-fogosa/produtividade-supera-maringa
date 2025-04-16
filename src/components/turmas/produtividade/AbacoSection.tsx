
import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Book, AlertCircle, Check, ChevronRight } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApostilas } from '@/hooks/use-apostilas';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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
  // Usar o hook de apostilas
  const { apostilas: apostilasDisponiveis, loading: carregandoApostila, error: erroApostila, getTotalPaginas } = useApostilas();
  const [totalPaginas, setTotalPaginas] = useState<number>(40);
  const isMobile = useIsMobile();
  const [valorOriginalApostila, setValorOriginalApostila] = useState<string>(apostilaAbaco);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  // Logar o carregamento das apostilas
  useEffect(() => {
    console.log('[AbacoSection] Hooks carregados - apostilasDisponiveis:', apostilasDisponiveis);
    console.log('[AbacoSection] Estado de carregamento:', carregandoApostila);
    console.log('[AbacoSection] Erro (se houver):', erroApostila);
  }, [apostilasDisponiveis, carregandoApostila, erroApostila]);
  
  // Atualizar o total de páginas quando a apostila selecionada mudar
  useEffect(() => {
    if (apostilaAbaco) {
      console.log('[AbacoSection] Apostila selecionada:', apostilaAbaco);
      const paginas = getTotalPaginas(apostilaAbaco);
      console.log(`[AbacoSection] Total de páginas da apostila ${apostilaAbaco}:`, paginas);
      setTotalPaginas(paginas);
    }
  }, [apostilaAbaco, getTotalPaginas]);

  // Guardar o valor original da apostila quando componente for montado
  useEffect(() => {
    if (apostilaAbaco) {
      setValorOriginalApostila(apostilaAbaco);
      console.log('[AbacoSection] Valor original da apostila definido:', apostilaAbaco);
    }
  }, []);

  // Função para tratar a mudança de valor da apostila
  const handleApostilaChange = (value: string) => {
    if (value) {
      setApostilaAbaco(value);
      if (isMobile) {
        setIsSheetOpen(false);
      }
    } else {
      // Se nenhum valor for selecionado, use o valor original (apostila atual do aluno)
      setApostilaAbaco(valorOriginalApostila);
      console.log('[AbacoSection] Restaurando para apostila original:', valorOriginalApostila);
    }
  };

  // Renderiza o seletor de apostilas com base no dispositivo (mobile ou desktop)
  const renderApostilaSelector = () => {
    if (isMobile) {
      return (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <div className="flex items-center justify-between p-3 border rounded-md cursor-pointer bg-white shadow-sm">
              <div className="flex items-center">
                <Book className="mr-2 h-5 w-5 text-gray-600" />
                <span className="line-clamp-1 font-medium">{apostilaAbaco || "Selecione a apostila"}</span>
              </div>
              <div className="flex items-center">
                <div className="text-xs text-muted-foreground mr-1">{apostilaAbaco ? `(${getTotalPaginas(apostilaAbaco)} páginas)` : ""}</div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </SheetTrigger>
          <SheetContent side="bottom" className="p-0 max-h-[85vh] overflow-hidden">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b sticky top-0 bg-background z-10">
                <h3 className="text-lg font-semibold">Selecione a apostila</h3>
              </div>
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-[calc(85vh-60px)] overflow-y-auto">
                  <div className="py-2 px-2">
                    {carregandoApostila ? (
                      <div className="p-4 text-center text-gray-500">
                        Carregando apostilas...
                      </div>
                    ) : apostilasDisponiveis.length > 0 ? (
                      <div className="space-y-1">
                        {apostilasDisponiveis.map((apostila) => (
                          <div 
                            key={apostila.nome} 
                            className={`flex items-center p-3 rounded-md ${apostilaAbaco === apostila.nome ? 'bg-accent' : 'hover:bg-muted'}`}
                            onClick={() => handleApostilaChange(apostila.nome)}
                          >
                            <Book className="mr-3 h-5 w-5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{apostila.nome}</div>
                              <div className="text-xs text-muted-foreground">{apostila.total_paginas} páginas</div>
                            </div>
                            {apostilaAbaco === apostila.nome && (
                              <Check className="ml-2 h-5 w-5 text-primary flex-shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        {erroApostila ? 'Erro ao carregar apostilas' : 'Nenhuma apostila disponível'}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      );
    } else {
      return (
        <Select 
          value={apostilaAbaco} 
          onValueChange={handleApostilaChange}
          defaultValue={apostilaAbaco}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione a apostila" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <ScrollArea className="h-[200px]">
              {apostilasDisponiveis.length > 0 ? (
                apostilasDisponiveis.map((apostila) => (
                  <SelectItem key={apostila.nome} value={apostila.nome} className="py-2">
                    <div className="flex items-center">
                      <Book className="mr-2 h-4 w-4" />
                      {apostila.nome} ({apostila.total_paginas} páginas)
                    </div>
                  </SelectItem>
                ))
              ) : (
                <div className="px-2 py-1 text-gray-500">
                  {carregandoApostila ? 'Carregando apostilas...' : 'Nenhuma apostila disponível'}
                </div>
              )}
            </ScrollArea>
          </SelectContent>
        </Select>
      );
    }
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="apostila-abaco">Apostila do ábaco</Label>
        {renderApostilaSelector()}
        
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

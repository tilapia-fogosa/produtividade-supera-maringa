
import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Book, AlertCircle, Check, ChevronRight, Search, X } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApostilas } from '@/hooks/use-apostilas';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

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
  nivelDesafio?: string;
  setNivelDesafio?: (value: string) => void;
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
  nivelDesafio = "",
  setNivelDesafio = () => {}
}) => {
  const { apostilas: apostilasDisponiveis, loading: carregandoApostila, error: erroApostila, getTotalPaginas } = useApostilas();
  const [totalPaginas, setTotalPaginas] = useState<number>(40);
  const isMobile = useIsMobile();
  const [valorOriginalApostila, setValorOriginalApostila] = useState<string>(apostilaAbaco);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    console.log('[AbacoSection] Hooks carregados - apostilasDisponiveis:', apostilasDisponiveis);
    console.log('[AbacoSection] Estado de carregamento:', carregandoApostila);
    console.log('[AbacoSection] Erro (se houver):', erroApostila);
  }, [apostilasDisponiveis, carregandoApostila, erroApostila]);
  
  useEffect(() => {
    if (apostilaAbaco) {
      console.log('[AbacoSection] Apostila selecionada:', apostilaAbaco);
      const paginas = getTotalPaginas(apostilaAbaco);
      console.log(`[AbacoSection] Total de páginas da apostila ${apostilaAbaco}:`, paginas);
      setTotalPaginas(paginas);
    }
  }, [apostilaAbaco, getTotalPaginas]);

  useEffect(() => {
    if (apostilaAbaco) {
      setValorOriginalApostila(apostilaAbaco);
      console.log('[AbacoSection] Valor original da apostila definido:', apostilaAbaco);
    }
  }, []);

  const handleApostilaChange = (value: string) => {
    if (value) {
      setApostilaAbaco(value);
      if (isMobile) {
        setIsSheetOpen(false);
      }
    } else {
      setApostilaAbaco(valorOriginalApostila);
      console.log('[AbacoSection] Restaurando para apostila original:', valorOriginalApostila);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const clearSearch = () => {
    setSearchTerm('');
  };

  // Filtrar as apostilas com base no termo de busca
  const filteredApostilas = apostilasDisponiveis.filter(apostila =>
    apostila.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <SheetContent side="bottom" className="max-h-[80vh] flex flex-col pb-0">
            <div className="sticky top-0 z-10 bg-background pb-2 mb-2 border-b">
              <h3 className="text-lg font-semibold px-1">Selecione a apostila</h3>
              
              {/* Campo de busca */}
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Buscar apostila..."
                  className="pl-10 pr-10"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                {searchTerm && (
                  <div 
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                    onClick={clearSearch}
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </div>
                )}
              </div>
              
              {/* Contador de resultados */}
              {searchTerm && (
                <div className="text-xs text-muted-foreground mt-1 px-1">
                  Encontradas {filteredApostilas.length} apostilas
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto overscroll-contain -mx-6 px-6 pb-16 touch-pan-y">
              {carregandoApostila ? (
                <div className="p-4 text-center text-gray-500">
                  Carregando apostilas...
                </div>
              ) : filteredApostilas.length > 0 ? (
                <div className="space-y-1">
                  {filteredApostilas.map((apostila) => (
                    <div 
                      key={apostila.nome} 
                      className={`flex items-center p-4 rounded-md ${apostilaAbaco === apostila.nome ? 'bg-accent' : 'hover:bg-muted'}`}
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
                  {searchTerm ? 'Nenhuma apostila encontrada. Tente outro termo.' : erroApostila ? 'Erro ao carregar apostilas' : 'Nenhuma apostila disponível'}
                </div>
              )}
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
            <div className="p-2 pb-0">
              <Input
                type="text"
                placeholder="Buscar apostila..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="mb-2"
              />
            </div>
            <ScrollArea className="h-[200px]">
              {filteredApostilas.length > 0 ? (
                filteredApostilas.map((apostila) => (
                  <SelectItem key={apostila.nome} value={apostila.nome} className="py-2">
                    <div className="flex items-center">
                      <Book className="mr-2 h-4 w-4" />
                      {apostila.nome} ({apostila.total_paginas} páginas)
                    </div>
                  </SelectItem>
                ))
              ) : (
                <div className="px-2 py-1 text-sm text-gray-500 text-center">
                  {searchTerm ? 'Nenhuma apostila encontrada' : carregandoApostila ? 'Carregando apostilas...' : 'Nenhuma apostila disponível'}
                </div>
              )}
            </ScrollArea>
          </SelectContent>
        </Select>
      );
    }
  };

  const handleDesafioChange = (value: "sim" | "não") => {
    setFezDesafio(value);
  };

  const handleNivelDesafioChange = (nivel: string) => {
    setNivelDesafio(nivel);
    console.log('Nível do desafio selecionado:', nivel);
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

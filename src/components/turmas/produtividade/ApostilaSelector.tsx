
import React, { useState } from 'react';
import { Book, ChevronRight, Check, Search, X } from 'lucide-react';
import { Apostila } from '@/hooks/use-apostilas';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

interface ApostilaSelectorProps {
  apostilaAbaco: string;
  apostilas: Apostila[];
  carregando: boolean;
  erro: string | null;
  totalPaginas: number;
  onApostilaChange: (value: string) => void;
}

const ApostilaSelector: React.FC<ApostilaSelectorProps> = ({
  apostilaAbaco,
  apostilas,
  carregando,
  erro,
  totalPaginas,
  onApostilaChange
}) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtrar as apostilas com base no termo de busca
  const filteredApostilas = apostilas.filter(apostila =>
    apostila.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const clearSearch = () => {
    setSearchTerm('');
  };
  
  const handleSelectApostila = (apostila: string) => {
    onApostilaChange(apostila);
    setIsSheetOpen(false);
  };
  
  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        <div className="flex items-center justify-between p-3 border rounded-md cursor-pointer bg-white shadow-sm">
          <div className="flex items-center">
            <Book className="mr-2 h-5 w-5 text-gray-600" />
            <span className="line-clamp-1 font-medium">{apostilaAbaco || "Selecione a apostila"}</span>
          </div>
          <div className="flex items-center">
            <div className="text-xs text-muted-foreground mr-1">{apostilaAbaco ? `(${totalPaginas} páginas)` : ""}</div>
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
          {carregando ? (
            <div className="p-4 text-center text-gray-500">
              Carregando apostilas...
            </div>
          ) : filteredApostilas.length > 0 ? (
            <div className="space-y-1">
              {filteredApostilas.map((apostila) => (
                <div 
                  key={apostila.nome} 
                  className={`flex items-center p-4 rounded-md ${apostilaAbaco === apostila.nome ? 'bg-accent' : 'hover:bg-muted'}`}
                  onClick={() => handleSelectApostila(apostila.nome)}
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
              {searchTerm ? 'Nenhuma apostila encontrada. Tente outro termo.' : erro ? 'Erro ao carregar apostilas' : 'Nenhuma apostila disponível'}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ApostilaSelector;

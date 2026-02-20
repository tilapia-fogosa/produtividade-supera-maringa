
import React, { useState } from 'react';
import { Book } from 'lucide-react';
import { Apostila } from '@/hooks/use-apostilas';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ApostilaSelectorDesktopProps {
  apostilaAbaco: string;
  apostilas: Apostila[];
  carregando: boolean;
  erro: string | null;
  onApostilaChange: (value: string) => void;
}

const ApostilaSelectorDesktop: React.FC<ApostilaSelectorDesktopProps> = ({
  apostilaAbaco,
  apostilas,
  carregando,
  erro,
  onApostilaChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtrar as apostilas com base no termo de busca
  const filteredApostilas = apostilas.filter(apostila =>
    apostila.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  return (
    <Select 
      value={apostilaAbaco} 
      onValueChange={onApostilaChange}
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
              {searchTerm ? 'Nenhuma apostila encontrada' : carregando ? 'Carregando apostilas...' : 'Nenhuma apostila disponível'}
            </div>
          )}
        </ScrollArea>
      </SelectContent>
    </Select>
  );
};

export default ApostilaSelectorDesktop;

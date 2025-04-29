
import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from 'lucide-react';
import { useApostilas } from '@/hooks/use-apostilas';
import { useIsMobile } from '@/hooks/use-mobile';
import ApostilaSelector from './ApostilaSelector';
import ApostilaSelectorDesktop from './ApostilaSelectorDesktop';
import DesafioSection from './DesafioSection';

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
    } else {
      setApostilaAbaco(valorOriginalApostila);
      console.log('[AbacoSection] Restaurando para apostila original:', valorOriginalApostila);
    }
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="apostila-abaco">Apostila do ábaco</Label>
        
        {isMobile ? (
          <ApostilaSelector 
            apostilaAbaco={apostilaAbaco}
            apostilas={apostilasDisponiveis}
            carregando={carregandoApostila}
            erro={erroApostila}
            totalPaginas={totalPaginas}
            onApostilaChange={handleApostilaChange}
          />
        ) : (
          <ApostilaSelectorDesktop 
            apostilaAbaco={apostilaAbaco}
            apostilas={apostilasDisponiveis}
            carregando={carregandoApostila}
            erro={erroApostila}
            onApostilaChange={handleApostilaChange}
          />
        )}
        
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
      
      <DesafioSection 
        fezDesafio={fezDesafio}
        setFezDesafio={setFezDesafio}
        nivelDesafio={nivelDesafio}
        setNivelDesafio={setNivelDesafio}
      />
      
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

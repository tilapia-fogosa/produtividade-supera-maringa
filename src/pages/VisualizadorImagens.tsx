import { useState, useEffect, useCallback } from 'react';
import { useGaleriaFotosVisualizador } from '@/hooks/use-galeria-fotos-visualizador';
import { Loader2 } from 'lucide-react';

// ID fixo da unidade de Maringá
const MARINGA_UNIT_ID = 'e7edf716-f293-4836-8ddc-b6e4463a64ad';

// Tempo de exibição de cada foto em milissegundos (8 segundos)
const SLIDE_INTERVAL = 8000;

export default function VisualizadorImagens() {
  const { data: fotos, isLoading } = useGaleriaFotosVisualizador(MARINGA_UNIT_ID);
  
  // Índices para os dois lados da tela
  const [indiceEsquerdo, setIndiceEsquerdo] = useState(0);
  const [indiceDireito, setIndiceDireito] = useState(1);
  
  // Estado para controlar fade
  const [fadeEsquerdo, setFadeEsquerdo] = useState(true);
  const [fadeDireito, setFadeDireito] = useState(true);

  const totalFotos = fotos?.length || 0;

  // Função para avançar as fotos
  const avancarFotos = useCallback(() => {
    if (totalFotos <= 2) return;

    // Fade out
    setFadeEsquerdo(false);
    setFadeDireito(false);

    setTimeout(() => {
      setIndiceEsquerdo(prev => (prev + 2) % totalFotos);
      setIndiceDireito(prev => {
        const novoIndice = (prev + 2) % totalFotos;
        // Garantir que não seja o mesmo índice
        if (novoIndice === (indiceEsquerdo + 2) % totalFotos) {
          return (novoIndice + 1) % totalFotos;
        }
        return novoIndice;
      });
      
      // Fade in
      setFadeEsquerdo(true);
      setFadeDireito(true);
    }, 500);
  }, [totalFotos, indiceEsquerdo]);

  // Inicializar índices quando fotos carregam
  useEffect(() => {
    if (fotos && fotos.length > 0) {
      setIndiceEsquerdo(0);
      setIndiceDireito(Math.min(1, fotos.length - 1));
    }
  }, [fotos]);

  // Carrossel automático
  useEffect(() => {
    if (totalFotos <= 2) return;

    const interval = setInterval(avancarFotos, SLIDE_INTERVAL);
    return () => clearInterval(interval);
  }, [totalFotos, avancarFotos]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  if (!fotos || fotos.length === 0) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <p className="text-white text-2xl">Nenhuma foto disponível</p>
      </div>
    );
  }

  const fotoEsquerda = fotos[indiceEsquerdo];
  const fotoDireita = fotos[indiceDireito] || fotos[0];

  return (
    <div className="h-screen w-screen bg-black flex overflow-hidden">
      {/* Lado Esquerdo */}
      <div className="w-1/2 h-full relative">
        <div 
          className={`absolute inset-0 transition-opacity duration-500 ${fadeEsquerdo ? 'opacity-100' : 'opacity-0'}`}
        >
          <img
            src={fotoEsquerda.url}
            alt={fotoEsquerda.nome}
            className="w-full h-full object-contain"
          />
          {/* Nome da foto */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <p className="text-white text-lg font-medium truncate">
              {fotoEsquerda.nome}
            </p>
          </div>
        </div>
      </div>

      {/* Divisor */}
      <div className="w-1 bg-white/20" />

      {/* Lado Direito */}
      <div className="w-1/2 h-full relative">
        <div 
          className={`absolute inset-0 transition-opacity duration-500 ${fadeDireito ? 'opacity-100' : 'opacity-0'}`}
        >
          <img
            src={fotoDireita.url}
            alt={fotoDireita.nome}
            className="w-full h-full object-contain"
          />
          {/* Nome da foto */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <p className="text-white text-lg font-medium truncate">
              {fotoDireita.nome}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

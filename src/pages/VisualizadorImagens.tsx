import { useState, useEffect, useCallback, useRef } from 'react';
import { useGaleriaFotosVisualizador } from '@/hooks/use-galeria-fotos-visualizador';
import { useVisualizadorEventos } from '@/hooks/use-visualizador-eventos';
import { useVisualizadorAvisos } from '@/hooks/use-visualizador-avisos';
import { Loader2 } from 'lucide-react';

// Mostrar countdown o tempo todo (60 segundos)
const COUNTDOWN_THRESHOLD = 60;

// ID fixo da unidade de Maringá
const MARINGA_UNIT_ID = '0df79a04-444e-46ee-b218-59e4b1835f4a';

// Tempos de troca em milissegundos
const FOTOS_INTERVAL = 60000; // 60 segundos para fotos
const EVENTOS_AVISOS_INTERVAL = 120000; // 120 segundos para eventos/avisos

type ItemDireita = {
  tipo: 'evento' | 'aviso';
  id: string;
  titulo: string;
  descricao?: string | null;
  imagem_url?: string | null;
  data_evento?: string;
  local?: string | null;
};

export default function VisualizadorImagens() {
  const { data: fotos, isLoading: isLoadingFotos } = useGaleriaFotosVisualizador(MARINGA_UNIT_ID);
  const { data: eventos, isLoading: isLoadingEventos } = useVisualizadorEventos(MARINGA_UNIT_ID);
  const { data: avisos, isLoading: isLoadingAvisos } = useVisualizadorAvisos(MARINGA_UNIT_ID);
  
  // Índice para fotos (lado esquerdo)
  const [indiceFoto, setIndiceFoto] = useState(0);
  const [fadeFoto, setFadeFoto] = useState(true);
  const [countdownFoto, setCountdownFoto] = useState(FOTOS_INTERVAL / 1000);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Índice para eventos/avisos (lado direito)
  const [indiceDireita, setIndiceDireita] = useState(0);
  const [fadeDireita, setFadeDireita] = useState(true);

  const totalFotos = fotos?.length || 0;

  // Combinar eventos e avisos em uma lista única
  const itensDireita: ItemDireita[] = [
    ...(eventos || []).map(e => ({
      tipo: 'evento' as const,
      id: e.id,
      titulo: e.titulo,
      descricao: e.descricao,
      imagem_url: e.imagem_url,
      data_evento: e.data_evento,
      local: e.local,
    })),
    ...(avisos || []).map(a => ({
      tipo: 'aviso' as const,
      id: a.id,
      titulo: a.nome,
      imagem_url: a.imagem_url,
    })),
  ];

  const totalDireita = itensDireita.length;

  // Função para avançar foto (lado esquerdo)
  const avancarFoto = useCallback(() => {
    if (totalFotos <= 1) return;

    setFadeFoto(false);
    setTimeout(() => {
      setIndiceFoto(prev => (prev + 1) % totalFotos);
      setFadeFoto(true);
      setCountdownFoto(FOTOS_INTERVAL / 1000); // Reset countdown
    }, 500);
  }, [totalFotos]);

  // Função para avançar evento/aviso (lado direito)
  const avancarDireita = useCallback(() => {
    if (totalDireita <= 1) return;

    setFadeDireita(false);
    setTimeout(() => {
      setIndiceDireita(prev => (prev + 1) % totalDireita);
      setFadeDireita(true);
    }, 500);
  }, [totalDireita]);

  // Reset índices quando dados mudam
  useEffect(() => {
    if (fotos && fotos.length > 0) {
      setIndiceFoto(0);
      setCountdownFoto(FOTOS_INTERVAL / 1000);
    }
  }, [fotos]);

  useEffect(() => {
    if (itensDireita.length > 0) {
      setIndiceDireita(0);
    }
  }, [eventos, avisos]);

  // Countdown timer para fotos
  useEffect(() => {
    if (totalFotos <= 1) return;

    countdownIntervalRef.current = setInterval(() => {
      setCountdownFoto(prev => {
        if (prev <= 1) {
          return FOTOS_INTERVAL / 1000;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [totalFotos]);

  // Carrossel automático para fotos (60s)
  useEffect(() => {
    if (totalFotos <= 1) return;

    const interval = setInterval(avancarFoto, FOTOS_INTERVAL);
    return () => clearInterval(interval);
  }, [totalFotos, avancarFoto]);

  // Carrossel automático para eventos/avisos (120s)
  useEffect(() => {
    if (totalDireita <= 1) return;

    const interval = setInterval(avancarDireita, EVENTOS_AVISOS_INTERVAL);
    return () => clearInterval(interval);
  }, [totalDireita, avancarDireita]);

  const isLoading = isLoadingFotos || isLoadingEventos || isLoadingAvisos;

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  const fotoAtual = fotos?.[indiceFoto];
  const itemDireitaAtual = itensDireita[indiceDireita];
  const showCountdown = totalFotos > 1 && countdownFoto <= COUNTDOWN_THRESHOLD;

  // Renderizar lado esquerdo (fotos)
  const renderLadoEsquerdo = () => {
    if (!fotoAtual) {
      return (
        <div className="w-1/2 h-full flex items-center justify-center bg-black p-2">
          <div className="w-full h-full border-2 border-white/30 rounded-lg flex items-center justify-center">
            <p className="text-white/50 text-xl">Nenhuma foto disponível</p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-1/2 h-full relative p-2">
        <div 
          className={`absolute inset-2 transition-opacity duration-500 border-2 border-white/30 rounded-lg overflow-hidden ${fadeFoto ? 'opacity-100' : 'opacity-0'}`}
        >
          <img
            src={fotoAtual.url}
            alt={fotoAtual.nome}
            className="w-full h-full object-contain"
          />
        </div>
        
        {/* Timer no rodapé */}
        {showCountdown && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-black/70 px-6 py-3 rounded-full border border-white/20">
            <div className="relative w-9 h-9">
              {/* Círculo de progresso estilo Windows */}
              <svg className="w-9 h-9" style={{ animation: 'spin 3s linear infinite' }} viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                />
                <circle
                  className="opacity-75"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="31.4"
                  strokeDashoffset="10"
                />
              </svg>
            </div>
            <span className="text-white text-xl font-medium tabular-nums">
              {countdownFoto}s
            </span>
          </div>
        )}
      </div>
    );
  };

  // Renderizar lado direito (eventos e avisos)
  const renderLadoDireito = () => {
    if (!itemDireitaAtual) {
      return (
        <div className="w-1/2 h-full flex items-center justify-center bg-black p-2">
          <div className="w-full h-full border-2 border-white/30 rounded-lg flex items-center justify-center">
            <p className="text-white/50 text-xl">Nenhum evento ou aviso</p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-1/2 h-full relative p-2">
        <div 
          className={`absolute inset-2 transition-opacity duration-500 border-2 border-white/30 rounded-lg overflow-hidden ${fadeDireita ? 'opacity-100' : 'opacity-0'}`}
        >
          {itemDireitaAtual.imagem_url ? (
            <img
              src={itemDireitaAtual.imagem_url}
              alt={itemDireitaAtual.titulo}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
              <div className="text-center p-8">
                <h2 className="text-white text-4xl font-bold mb-4">
                  {itemDireitaAtual.titulo}
                </h2>
                {itemDireitaAtual.descricao && (
                  <p className="text-white/80 text-xl">
                    {itemDireitaAtual.descricao}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-screen bg-black flex overflow-hidden">
      {/* Lado Esquerdo - Fotos da Galeria */}
      {renderLadoEsquerdo()}

      {/* Lado Direito - Eventos e Avisos */}
      {renderLadoDireito()}
    </div>
  );
}

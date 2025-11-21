import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import templateV1 from '@/assets/devolutiva-fim-ano-template-v3.png';
import templateV2 from '@/assets/devolutiva-fim-ano-template-v2.png';
import './devolutiva-fim-ano.css';

const DevolutivaFimAnoImpressao: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [dadosPessoa, setDadosPessoa] = useState<any>(null);
  const [fotoCarregada, setFotoCarregada] = useState(false);
  const [templateCarregado, setTemplateCarregado] = useState(false);

  useEffect(() => {
    // Recuperar dados do sessionStorage
    console.log('[DevolutivaFimAnoImpressao] Tentando recuperar dados do sessionStorage');
    const dados = sessionStorage.getItem('devolutiva-impressao');
    console.log('[DevolutivaFimAnoImpressao] Dados recuperados:', dados);
    if (dados) {
      const dadosParsed = JSON.parse(dados);
      console.log('[DevolutivaFimAnoImpressao] Dados parseados:', dadosParsed);
      setDadosPessoa(dadosParsed);
    } else {
      console.error('[DevolutivaFimAnoImpressao] Nenhum dado encontrado no sessionStorage');
    }
  }, []);

  // Carregar foto de fundo
  useEffect(() => {
    if (dadosPessoa?.fotoUrl) {
      console.log('[DevolutivaFimAnoImpressao] Carregando foto:', dadosPessoa.fotoUrl);
      const img = new Image();
      img.onload = () => {
        console.log('[DevolutivaFimAnoImpressao] Foto carregada com sucesso');
        setFotoCarregada(true);
      };
      img.onerror = () => {
        console.error('[DevolutivaFimAnoImpressao] Erro ao carregar foto');
        setFotoCarregada(true); // Continuar mesmo com erro
      };
      img.src = dadosPessoa.fotoUrl;
    } else {
      console.log('[DevolutivaFimAnoImpressao] Sem foto, marcando como carregado');
      setFotoCarregada(true);
    }
  }, [dadosPessoa]);

  // Disparar impressão quando tudo estiver pronto
  useEffect(() => {
    if (dadosPessoa && fotoCarregada && templateCarregado) {
      console.log('[DevolutivaFimAnoImpressao] Tudo carregado, aguardando fontes...');
      document.fonts.ready.then(() => {
        console.log('[DevolutivaFimAnoImpressao] Fontes carregadas, disparando impressão em 500ms');
        setTimeout(() => {
          console.log('[DevolutivaFimAnoImpressao] Chamando window.print()');
          window.print();
        }, 500);
      });
    }
  }, [dadosPessoa, fotoCarregada, templateCarregado]);

  useEffect(() => {
    // Forçar portrait via meta tag
    const metaViewport = document.createElement('meta');
    metaViewport.name = 'viewport';
    metaViewport.content = 'width=210mm, height=297mm';
    metaViewport.setAttribute('data-devolutiva-meta', 'true');
    document.head.appendChild(metaViewport);
    
    // Adicionar classe específica para devolutivas
    document.body.classList.add('printing-devolutiva');
    
    return () => {
      const meta = document.head.querySelector('meta[data-devolutiva-meta]');
      if (meta) {
        document.head.removeChild(meta);
      }
      document.body.classList.remove('printing-devolutiva');
    };
  }, []);

  if (!dadosPessoa) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  // Selecionar template baseado na versão
  const templateOverlay = dadosPessoa.versaoTemplate === 1 ? templateV1 : templateV2;

  return (
    <div className="devolutiva-fim-ano-wrapper" style={{ padding: 0, minHeight: '100vh' }}>
      <div className="devolutiva-fim-ano-container" style={{ padding: 0 }}>
        <div className="a4-page">
          {/* Camada de fundo - FOTO DO ALUNO */}
          {dadosPessoa.fotoUrl && (
            <div 
              className="foto-aluno-background"
              style={{
                backgroundImage: `url(${dadosPessoa.fotoUrl})`,
                backgroundSize: `${dadosPessoa.tamanhoFoto}%`,
                backgroundPosition: `${dadosPessoa.posicaoX}% ${dadosPessoa.posicaoY}%`
              }}
            />
          )}
          
          {/* Camada de overlay - TEMPLATE COM TRANSPARÊNCIA */}
          <img 
            src={templateOverlay} 
            alt="Template Devolutiva" 
            className="template-overlay"
            onLoad={() => {
              console.log('[DevolutivaFimAnoImpressao] Template carregado');
              setTemplateCarregado(true);
            }}
          />
          
          {/* Nome do aluno */}
          <div 
            className="absolute font-abril-fatface"
            style={{
              top: `${dadosPessoa.alturaNome}%`,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 3,
              color: '#000',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              fontSize: `${dadosPessoa.tamanhoFonte}px`
            }}
          >
            {dadosPessoa.nome}
          </div>
          
          {/* Total de desafios 2025 */}
          <div 
            className="absolute font-abril-fatface"
            style={{
              top: `${dadosPessoa.alturaExercicios}%`,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 3,
              color: '#000',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              fontSize: '30px'
            }}
          >
            {dadosPessoa.totalDesafios}
          </div>
          
          {/* Total de exercícios ábaco 2025 */}
          <div 
            className="absolute font-abril-fatface"
            style={{
              top: `${dadosPessoa.alturaExercicios}%`,
              left: `${dadosPessoa.posicaoXExerciciosAbaco}%`,
              transform: 'translateX(-50%)',
              zIndex: 3,
              color: '#000',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              fontSize: '30px'
            }}
          >
            {dadosPessoa.totalExerciciosAbaco}
          </div>
          
          {/* Total de exercícios AH 2025 */}
          <div 
            className="absolute font-abril-fatface"
            style={{
              top: `${dadosPessoa.alturaExercicios}%`,
              left: `${dadosPessoa.posicaoXExerciciosAH}%`,
              transform: 'translateX(-50%)',
              zIndex: 3,
              color: '#000',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              fontSize: '30px'
            }}
          >
            {dadosPessoa.totalExerciciosAH}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevolutivaFimAnoImpressao;

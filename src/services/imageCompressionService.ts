import imageCompression from 'browser-image-compression';
import heic2any from 'heic2any';

// Configurações otimizadas para qualidade e performance
const TARGET_SIZE_MB = 8; // 8MB - tamanho alvo (qualidade alta)
const MAX_DIMENSION = 4096; // 4096px - dimensão máxima (excelente para impressão)

/**
 * Detecta e converte imagens HEIC/HEIF para JPG
 * Necessário porque navegadores não suportam renderização de HEIC
 */
async function convertHeicIfNeeded(file: File): Promise<File> {
  // Verificar se é HEIC/HEIF
  const isHeic = file.type === 'image/heic' || 
                 file.type === 'image/heif' ||
                 file.name.toLowerCase().endsWith('.heic') ||
                 file.name.toLowerCase().endsWith('.heif');
  
  if (!isHeic) {
    return file;
  }
  
  console.log('🔄 Detectado formato HEIC/HEIF, convertendo para JPG...');
  
  try {
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.95
    });
    
    // heic2any pode retornar array de Blobs se houver múltiplas imagens
    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    
    // Converter Blob para File
    const convertedFile = new File(
      [blob],
      file.name.replace(/\.(heic|heif)$/i, '.jpg'),
      { type: 'image/jpeg' }
    );
    
    console.log('✅ HEIC convertido para JPG:', {
      tamanhoOriginal: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      tamanhoConvertido: `${(convertedFile.size / (1024 * 1024)).toFixed(2)}MB`
    });
    
    return convertedFile;
  } catch (error) {
    console.error('❌ Erro ao converter HEIC:', error);
    throw new Error('Não foi possível converter a imagem HEIC. Tente exportar como JPG do seu dispositivo.');
  }
}

/**
 * Processa e otimiza imagens para uso na aplicação
 * SEMPRE processa para garantir dimensões adequadas e boa performance
 * Mantém alta qualidade (95%) e suporta dimensões grandes (4096px)
 */
export async function compressImageIfNeeded(file: File): Promise<File> {
  const fileSizeMB = file.size / (1024 * 1024);
  
  console.log('📊 Processando imagem:', {
    nome: file.name,
    tamanho: `${fileSizeMB.toFixed(2)}MB`,
    tipo: file.type
  });
  
  try {
    // 1. Converter HEIC para JPG se necessário
    const convertedFile = await convertHeicIfNeeded(file);
    
    // 2. SEMPRE comprimir/otimizar a imagem
    // Isso garante dimensões adequadas e melhor performance
    console.log('🗜️ Otimizando imagem para web...');
    
    const options = {
      maxSizeMB: TARGET_SIZE_MB,        // Máximo 8MB (alta qualidade)
      maxWidthOrHeight: MAX_DIMENSION,  // 4096px (excelente para impressão)
      useWebWorker: false,              // Desabilitar Web Worker para evitar problemas
      fileType: convertedFile.type,     // Manter formato (exceto se era HEIC)
      initialQuality: 0.95,             // 95% de qualidade inicial
    };
    
    let processedFile: File;
    
    try {
      processedFile = await imageCompression(convertedFile, options);
      
      const processedSizeMB = processedFile.size / (1024 * 1024);
      const reducao = ((1 - processedFile.size / convertedFile.size) * 100).toFixed(1);
      
      console.log('✅ Imagem processada:', {
        tamanhoOriginal: `${(convertedFile.size / (1024 * 1024)).toFixed(2)}MB`,
        tamanhoFinal: `${processedSizeMB.toFixed(2)}MB`,
        reducao: `${reducao}%`,
        formato: processedFile.type
      });
    } catch (compressionError) {
      console.warn('⚠️ Erro ao comprimir, usando arquivo original:', compressionError);
      
      // Fallback: se a compressão falhar, verifica o tamanho e retorna o arquivo original ou redimensionado
      const fileSizeMB = convertedFile.size / (1024 * 1024);
      
      if (fileSizeMB > TARGET_SIZE_MB) {
        // Arquivo muito grande, tenta redimensionar apenas
        console.log('🔄 Tentando apenas redimensionar...');
        processedFile = await imageCompression(convertedFile, {
          maxWidthOrHeight: MAX_DIMENSION,
          useWebWorker: false,
        });
      } else {
        // Arquivo já está em tamanho aceitável
        console.log('✅ Usando arquivo original (tamanho aceitável)');
        processedFile = convertedFile;
      }
    }
    
    return processedFile;
  } catch (error) {
    console.error('❌ Erro ao processar imagem:', error);
    
    // Mensagem de erro mais amigável
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    throw new Error(`Não foi possível processar a imagem: ${errorMessage}. Tente usar outro formato ou reduzir o tamanho do arquivo.`);
  }
}

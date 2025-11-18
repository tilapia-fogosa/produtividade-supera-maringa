import imageCompression from 'browser-image-compression';
import heic2any from 'heic2any';

const TARGET_SIZE_MB = 4; // 4MB - tamanho alvo
const MAX_DIMENSION = 2048; // Dimensão máxima (suficiente para impressão de qualidade)

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
      quality: 0.9
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
      maxSizeMB: TARGET_SIZE_MB,        // Máximo 4MB (bom equilíbrio qualidade/tamanho)
      maxWidthOrHeight: MAX_DIMENSION,  // 2048px (ótimo para impressão e web)
      useWebWorker: true,               // Não travar a interface
      fileType: convertedFile.type,     // Manter formato (exceto se era HEIC)
      initialQuality: 0.9,              // 90% de qualidade inicial
    };
    
    const processedFile = await imageCompression(convertedFile, options);
    
    const processedSizeMB = processedFile.size / (1024 * 1024);
    const reducao = ((1 - processedFile.size / convertedFile.size) * 100).toFixed(1);
    
    console.log('✅ Imagem processada:', {
      tamanhoOriginal: `${(convertedFile.size / (1024 * 1024)).toFixed(2)}MB`,
      tamanhoFinal: `${processedSizeMB.toFixed(2)}MB`,
      reducao: `${reducao}%`,
      formato: processedFile.type
    });
    
    return processedFile;
  } catch (error) {
    console.error('❌ Erro ao processar imagem:', error);
    throw new Error('Não foi possível processar a imagem. ' + (error instanceof Error ? error.message : ''));
  }
}

import imageCompression from 'browser-image-compression';

// DESABILITADO: Compressão automática removida para manter qualidade máxima
// O bucket agora não tem limite de tamanho, permitindo imagens em alta qualidade
const MAX_SIZE_MB = 50; // 50MB - apenas para arquivos extremamente grandes
const TARGET_SIZE_MB = 20; // 20MB - tamanho alvo após compressão (apenas backup)

export async function compressImageIfNeeded(file: File): Promise<File> {
  const fileSizeMB = file.size / (1024 * 1024);
  
  console.log('📊 Verificando imagem:', {
    nome: file.name,
    tamanho: `${fileSizeMB.toFixed(2)}MB`,
    tipo: file.type
  });
  
  // Agora aceita imagens até 50MB sem compressão (qualidade máxima)
  if (fileSizeMB <= MAX_SIZE_MB) {
    console.log('✅ Imagem aceita sem compressão - qualidade máxima mantida');
    return file;
  }
  
  console.log('🗜️ Imagem grande, iniciando compressão...');
  
  try {
    const options = {
      maxSizeMB: TARGET_SIZE_MB,
      maxWidthOrHeight: 2048, // Limitar dimensão máxima
      useWebWorker: true, // Usar Web Worker para não travar UI
      fileType: file.type, // Manter formato original
      initialQuality: 0.8, // Qualidade inicial (80%)
    };
    
    const compressedFile = await imageCompression(file, options);
    
    const compressedSizeMB = compressedFile.size / (1024 * 1024);
    const reducao = ((1 - compressedFile.size / file.size) * 100).toFixed(1);
    
    console.log('✅ Compressão concluída:', {
      tamanhoOriginal: `${fileSizeMB.toFixed(2)}MB`,
      tamanhoComprimido: `${compressedSizeMB.toFixed(2)}MB`,
      reducao: `${reducao}%`
    });
    
    return compressedFile;
  } catch (error) {
    console.error('❌ Erro ao comprimir imagem:', error);
    throw new Error('Não foi possível comprimir a imagem. Tente uma imagem menor.');
  }
}

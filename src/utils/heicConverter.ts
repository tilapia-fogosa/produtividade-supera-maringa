import heic2any from 'heic2any';

/**
 * Converte arquivo HEIC para JPEG
 * @param file - Arquivo HEIC original
 * @returns Promise com o arquivo convertido em JPEG
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  console.log('🔄 Convertendo HEIC para JPEG...', { name: file.name, size: file.size });
  
  try {
    // Converter HEIC para JPEG usando heic2any
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9, // Alta qualidade
    });

    // heic2any pode retornar um array de Blobs ou um único Blob
    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

    // Criar um novo File a partir do Blob
    const newFileName = file.name.replace(/\.heic$/i, '.jpg');
    const convertedFile = new File([blob], newFileName, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });

    console.log('✅ Conversão HEIC concluída:', { 
      originalSize: file.size, 
      convertedSize: convertedFile.size,
      originalName: file.name,
      convertedName: convertedFile.name
    });

    return convertedFile;
  } catch (error) {
    console.error('❌ Erro ao converter HEIC:', error);
    throw new Error('Não foi possível converter a imagem HEIC. Tente usar outro formato.');
  }
}

/**
 * Verifica se o arquivo é HEIC
 * @param file - Arquivo a ser verificado
 * @returns true se o arquivo é HEIC
 */
export function isHeicFile(file: File): boolean {
  return file.type === 'image/heic' || 
         file.type === 'image/heif' || 
         file.name.toLowerCase().endsWith('.heic') ||
         file.name.toLowerCase().endsWith('.heif');
}

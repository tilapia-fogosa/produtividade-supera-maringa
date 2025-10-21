import { supabase } from '@/integrations/supabase/client';

export interface DownloadAndUploadResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
}

export async function downloadAndUploadToSupabase(
  fileId: string,
  fileName: string,
  pessoaId: string,
  tipoPessoa: 'aluno' | 'funcionario',
  accessToken: string
): Promise<DownloadAndUploadResult> {
  console.log('🚀 Iniciando downloadAndUploadToSupabase:', { fileId, fileName, pessoaId, tipoPessoa });
  
  try {
    // 1. Download da imagem do Google Drive
    console.log('📥 Baixando arquivo do Google Drive...');
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    console.log('🔗 URL de download:', downloadUrl);
    
    const response = await fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log('📊 Resposta do Google Drive:', { 
      status: response.status, 
      statusText: response.statusText,
      contentType: response.headers.get('content-type')
    });

    if (!response.ok) {
      throw new Error(`Erro ao baixar arquivo: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    console.log('✅ Arquivo baixado:', { size: blob.size, type: blob.type });

    // 2. Upload para Supabase Storage
    console.log('☁️ Iniciando upload para Supabase...');
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `devolutivas/${tipoPessoa}/${pessoaId}/${timestamp}-${sanitizedFileName}`;
    console.log('📁 Caminho no storage:', storagePath);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('fotos-pessoas')
      .upload(storagePath, blob, {
        contentType: blob.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ Erro no upload:', uploadError);
      throw new Error(`Erro ao fazer upload: ${uploadError.message}`);
    }
    
    console.log('✅ Upload concluído:', uploadData);

    // 3. Obter URL pública
    console.log('🔗 Obtendo URL pública...');
    const { data: urlData } = supabase.storage
      .from('fotos-pessoas')
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;
    console.log('✅ URL pública gerada:', publicUrl);

    // 4. Atualizar banco de dados
    const tabela = tipoPessoa === 'aluno' ? 'alunos' : 'funcionarios';
    console.log(`💾 Atualizando tabela ${tabela}...`);
    
    const { error: updateError } = await supabase
      .from(tabela)
      .update({ foto_devolutiva_url: publicUrl })
      .eq('id', pessoaId);

    if (updateError) {
      console.error('❌ Erro ao atualizar banco:', updateError);
      throw new Error(`Erro ao atualizar banco: ${updateError.message}`);
    }

    console.log('✅ Banco de dados atualizado com sucesso!');
    return {
      success: true,
      publicUrl,
    };
  } catch (error) {
    console.error('❌ Erro em downloadAndUploadToSupabase:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

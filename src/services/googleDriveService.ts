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
  try {
    // 1. Download da imagem do Google Drive
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ao baixar arquivo: ${response.statusText}`);
    }

    const blob = await response.blob();

    // 2. Upload para Supabase Storage
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `devolutivas/${tipoPessoa}/${pessoaId}/${timestamp}-${sanitizedFileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('fotos-pessoas')
      .upload(storagePath, blob, {
        contentType: blob.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Erro ao fazer upload: ${uploadError.message}`);
    }

    // 3. Obter URL pública
    const { data: urlData } = supabase.storage
      .from('fotos-pessoas')
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // 4. Atualizar banco de dados
    const tabela = tipoPessoa === 'aluno' ? 'alunos' : 'funcionarios';
    
    const { error: updateError } = await supabase
      .from(tabela)
      .update({ foto_devolutiva_url: publicUrl })
      .eq('id', pessoaId);

    if (updateError) {
      throw new Error(`Erro ao atualizar banco: ${updateError.message}`);
    }

    return {
      success: true,
      publicUrl,
    };
  } catch (error) {
    console.error('Erro em downloadAndUploadToSupabase:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

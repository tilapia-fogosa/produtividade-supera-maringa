import { useState } from 'react';
import { downloadAndUploadToSupabase } from '@/services/googleDriveService';

export function useGoogleDrivePhoto() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const salvarFotoDevolutiva = async (
    fileId: string,
    fileName: string,
    pessoaId: string,
    tipoPessoa: 'aluno' | 'funcionario',
    accessToken: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await downloadAndUploadToSupabase(
        fileId,
        fileName,
        pessoaId,
        tipoPessoa,
        accessToken
      );

      if (!result.success) {
        setError(result.error || 'Erro ao salvar foto');
        return false;
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar foto';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    salvarFotoDevolutiva,
    loading,
    error,
  };
}

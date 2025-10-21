import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { GOOGLE_CONFIG } from '@/config/google';
import { useGoogleDrivePhoto } from '@/hooks/use-google-drive-photo';

interface GoogleDrivePickerProps {
  onPhotoSelected: () => void;
  currentPhotoUrl?: string;
  pessoaId: string;
  tipoPessoa: 'aluno' | 'funcionario';
}

export const GoogleDrivePicker: React.FC<GoogleDrivePickerProps> = ({
  onPhotoSelected,
  currentPhotoUrl,
  pessoaId,
  tipoPessoa,
}) => {
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [pickerLoaded, setPickerLoaded] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ id: string; name: string; thumbnail?: string } | null>(null);
  
  const { salvarFotoDevolutiva, loading: salvandoFoto, error } = useGoogleDrivePhoto();

  // Carregar APIs do Google
  useEffect(() => {
    const loadGoogleApis = () => {
      // Carregar GAPI
      if (window.gapi) {
        window.gapi.load('client', async () => {
          await window.gapi.client.init({
            apiKey: GOOGLE_CONFIG.apiKey,
            discoveryDocs: GOOGLE_CONFIG.discoveryDocs,
          });
          setGapiLoaded(true);
        });
      }

      // Carregar Google Picker
      if (window.google?.picker) {
        setPickerLoaded(true);
      }
    };

    // Verificar se já estão carregados
    if (window.gapi && window.google?.picker) {
      loadGoogleApis();
    } else {
      // Aguardar carregamento
      const checkInterval = setInterval(() => {
        if (window.gapi && window.google?.picker) {
          loadGoogleApis();
          clearInterval(checkInterval);
        }
      }, 100);

      return () => clearInterval(checkInterval);
    }
  }, []);

  const handleAuthClick = () => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CONFIG.clientId,
      scope: GOOGLE_CONFIG.scopes.join(' '),
      callback: (response) => {
        if (response.access_token) {
          setAccessToken(response.access_token);
          showPicker(response.access_token);
        }
      },
    });

    tokenClient.requestAccessToken();
  };

  const showPicker = (token: string) => {
    if (!pickerLoaded || !gapiLoaded) {
      console.error('Google APIs não carregadas');
      return;
    }

    const picker = new window.google.picker.PickerBuilder()
      .addView(window.google.picker.ViewId.DOCS_IMAGES)
      .setOAuthToken(token)
      .setDeveloperKey(GOOGLE_CONFIG.apiKey)
      .setCallback(pickerCallback)
      .setOrigin(window.location.origin)
      .setTitle('Selecione uma foto')
      .build();

    picker.setVisible(true);
  };

  const pickerCallback = async (data: GooglePickerResponse) => {
    if (data.action === window.google.picker.Action.PICKED && data.docs) {
      const file = data.docs[0];
      setSelectedFile({
        id: file.id,
        name: file.name,
        thumbnail: file.thumbnailUrl,
      });

      // Salvar foto automaticamente
      if (accessToken) {
        const success = await salvarFotoDevolutiva(
          file.id,
          file.name,
          pessoaId,
          tipoPessoa,
          accessToken
        );

        if (success) {
          onPhotoSelected();
        }
      }
    }
  };

  const apisCarregadas = gapiLoaded && pickerLoaded;

  return (
    <div className="space-y-3">
      <Button
        onClick={handleAuthClick}
        disabled={!apisCarregadas || salvandoFoto}
        variant="outline"
        className="w-full"
      >
        {!apisCarregadas ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Carregando Google Drive...
          </>
        ) : salvandoFoto ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando foto...
          </>
        ) : (
          <>
            <ImageIcon className="mr-2 h-4 w-4" />
            Selecionar Foto do Google Drive
          </>
        )}
      </Button>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {selectedFile && !salvandoFoto && !error && (
        <Card className="p-3">
          <div className="flex items-center gap-3">
            {selectedFile.thumbnail && (
              <img
                src={selectedFile.thumbnail}
                alt={selectedFile.name}
                className="w-12 h-12 object-cover rounded"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Salva com sucesso
              </p>
            </div>
          </div>
        </Card>
      )}

      {currentPhotoUrl && !selectedFile && (
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <img
              src={currentPhotoUrl}
              alt="Foto atual"
              className="w-12 h-12 object-cover rounded"
            />
            <div className="flex-1">
              <p className="text-sm font-medium">Foto atual da devolutiva</p>
              <p className="text-xs text-muted-foreground">Selecione outra para substituir</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Image as ImageIcon, CheckCircle2, AlertCircle, Upload } from 'lucide-react';
import { GOOGLE_CONFIG } from '@/config/google';
import { useGoogleDrivePhoto } from '@/hooks/use-google-drive-photo';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { uploadLocalFileToSupabase } from '@/services/googleDriveService';

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
  const tokenRef = useRef<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ id: string; name: string; thumbnail?: string } | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string>('Inicializando...');
  // Modo alternativo: colar link/ID do Drive
  const [manualOpen, setManualOpen] = useState<boolean>(false);
  const [manualInput, setManualInput] = useState<string>('');
  const [manualError, setManualError] = useState<string | null>(null);
  // Upload de arquivo local
  const [uploadingLocal, setUploadingLocal] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [localFileError, setLocalFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { salvarFotoDevolutiva, loading: salvandoFoto, error } = useGoogleDrivePhoto();

  console.log('🔍 GoogleDrivePicker - Estado atual:', {
    gapiLoaded,
    pickerLoaded,
    hasAccessToken: !!accessToken,
    salvandoFoto,
    error,
    loadingError,
    loadingStatus
  });

  // Carregar APIs do Google com timeout e logs detalhados
  useEffect(() => {
    console.log('📡 Iniciando carregamento das APIs do Google...');
    setLoadingStatus('Carregando APIs do Google...');
    
    let timeoutId: NodeJS.Timeout;

    const loadGoogleApis = async () => {
      try {
        if (!window.gapi) {
          console.error('❌ window.gapi não encontrado');
          setLoadingError('Google API não está disponível. Verifique sua conexão.');
          return;
        }

        console.log('✅ GAPI encontrado, carregando client e picker...');
        setLoadingStatus('Carregando Google Client...');
        
        // Carregar client primeiro
        window.gapi.load('client:picker', async () => {
          try {
            console.log('🔑 Inicializando GAPI client...');
            
            await window.gapi.client.init({
              apiKey: GOOGLE_CONFIG.apiKey,
              discoveryDocs: GOOGLE_CONFIG.discoveryDocs,
            });
            
            console.log('✅ GAPI client inicializado');
            console.log('✅ Google Picker carregado');
            
            setGapiLoaded(true);
            setPickerLoaded(true);
            setLoadingStatus('APIs carregadas com sucesso!');
            clearTimeout(timeoutId);
          } catch (err) {
            console.error('❌ Erro ao inicializar GAPI:', err);
            setLoadingError('Erro ao inicializar: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
          }
        });
      } catch (err) {
        console.error('❌ Erro ao carregar APIs:', err);
        setLoadingError('Erro ao carregar: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
      }
    };

    // Aguardar que window.gapi esteja disponível
    const waitForGapi = () => {
      if (window.gapi) {
        console.log('✅ GAPI disponível, iniciando carregamento...');
        loadGoogleApis();
      } else {
        console.log('⏳ Aguardando GAPI...');
        setTimeout(waitForGapi, 100);
      }
    };

    // Timeout após 15 segundos
    timeoutId = setTimeout(() => {
      console.error('❌ Timeout: APIs do Google não carregaram');
      setLoadingError('Timeout ao carregar Google APIs. Recarregue a página.');
    }, 15000);

    waitForGapi();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const handleAuthClick = () => {
    console.log('🔐 Iniciando autenticação OAuth...');
    setLoadingStatus('Autenticando...');
    
    try {
      if (!window.google?.accounts?.oauth2) {
        throw new Error('Google OAuth2 não está disponível');
      }

      console.log('🔑 Configuração OAuth:', {
        clientId: GOOGLE_CONFIG.clientId.substring(0, 20) + '...',
        scopes: GOOGLE_CONFIG.scopes
      });

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CONFIG.clientId,
        scope: GOOGLE_CONFIG.scopes.join(' '),
        callback: (response) => {
          console.log('📥 Resposta OAuth recebida:', { hasToken: !!response.access_token });
          
          if (response.access_token) {
            console.log('✅ Token de acesso obtido');
            setAccessToken(response.access_token);
            tokenRef.current = response.access_token;
            console.log('✅ Token armazenado na ref');
            setLoadingStatus('Abrindo seletor de arquivos...');
            showPicker(response.access_token);
          } else {
            console.error('❌ Token não recebido na resposta OAuth');
            setLoadingError('Falha na autenticação. Tente novamente.');
          }
        },
      });

      console.log('📤 Solicitando token de acesso...');
      tokenClient.requestAccessToken();
    } catch (err) {
      console.error('❌ Erro na autenticação:', err);
      setLoadingError('Erro ao autenticar: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    }
  };

  const showPicker = (token: string) => {
    console.log('🖼️ Abrindo Google Picker...');
    
    if (!pickerLoaded || !gapiLoaded) {
      const error = 'Google APIs não carregadas completamente';
      console.error('❌', error, { pickerLoaded, gapiLoaded });
      setLoadingError(error);
      return;
    }

    try {
      console.log('🔨 Construindo picker...');
      const picker = new window.google.picker.PickerBuilder()
        .addView(window.google.picker.ViewId.DOCS_IMAGES)
        .setOAuthToken(token)
        .setDeveloperKey(GOOGLE_CONFIG.apiKey)
        .setCallback(pickerCallback)
        .setOrigin(window.location.origin)
        .setTitle('Selecione uma foto')
        .build();

      console.log('✅ Picker construído, abrindo interface...');
      picker.setVisible(true);
      setLoadingStatus('Aguardando seleção...');
    } catch (err) {
      console.error('❌ Erro ao criar picker:', err);
      setLoadingError('Erro ao abrir seletor: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    }
  };

  const pickerCallback = async (data: GooglePickerResponse) => {
    console.log('📋 Picker callback:', { action: data.action, hasDocs: !!data.docs });
    
    if (data.action === window.google.picker.Action.PICKED && data.docs) {
      const file = data.docs[0];
      console.log('✅ Arquivo selecionado:', { id: file.id, name: file.name, mimeType: file.mimeType });
      
      setSelectedFile({
        id: file.id,
        name: file.name,
        thumbnail: file.thumbnailUrl,
      });
      setLoadingStatus('Salvando foto...');

      // Salvar foto automaticamente
      if (tokenRef.current) {
        console.log('💾 Iniciando salvamento da foto com token da ref...');
        const success = await salvarFotoDevolutiva(
          file.id,
          file.name,
          pessoaId,
          tipoPessoa,
          tokenRef.current
        );

        if (success) {
          console.log('✅ Foto salva com sucesso!');
          setLoadingStatus('Concluído!');
          onPhotoSelected();
        } else {
          console.error('❌ Falha ao salvar foto');
        }
      } else {
        console.error('❌ Token de acesso não disponível na ref');
        setLoadingError('Token de acesso não disponível');
      }
    } else if (data.action === window.google.picker.Action.CANCEL) {
      console.log('ℹ️ Usuário cancelou a seleção');
      setLoadingStatus('Cancelado');
    }
  };

  // Extrai o ID do arquivo a partir de diferentes formatos de link do Drive
  const extractDriveFileId = (input: string): string | null => {
    if (!input) return null;
    const trimmed = input.trim();
    // Caso seja apenas o ID
    if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed) && !trimmed.includes('google')) return trimmed;
    try {
      const url = new URL(trimmed);
      // Formato /file/d/{id}/view
      const dMatch = url.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (dMatch?.[1]) return dMatch[1];
      // Parâmetro id=...
      const byParam = url.searchParams.get('id');
      if (byParam) return byParam;
    } catch {
      // não é URL
    }
    return null;
  };

  const handleManualSubmit = async () => {
    setManualError(null);
    const fileId = extractDriveFileId(manualInput);
    if (!fileId) {
      setManualError('Link/ID inválido. Verifique e tente novamente.');
      return;
    }
    setLoadingStatus('Salvando via link do Drive...');
    const nome = `drive_${fileId}.jpg`;
    const ok = await salvarFotoDevolutiva(fileId, nome, pessoaId, tipoPessoa, '');
    if (ok) {
      setSelectedFile({ id: fileId, name: nome });
      onPhotoSelected();
    }
  };

  const handleLocalFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLocalFileError(null);
    setUploadingLocal(true);
    setCompressing(false);

    // Verificar se precisa comprimir
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 5) {
      setCompressing(true);
      setLoadingStatus('Comprimindo imagem grande...');
      console.log('🗜️ Imagem grande detectada, comprimindo...');
    } else {
      setLoadingStatus('Fazendo upload do arquivo...');
    }

    console.log('📁 Arquivo selecionado:', { name: file.name, size: file.size, type: file.type });

    try {
      const result = await uploadLocalFileToSupabase(file, pessoaId, tipoPessoa);
      
      if (result.success) {
        console.log('✅ Upload local concluído com sucesso!');
        setSelectedFile({
          id: 'local-' + Date.now(),
          name: file.name,
        });
        setLoadingStatus('Concluído!');
        onPhotoSelected();
      } else {
        setLocalFileError(result.error || 'Erro ao fazer upload do arquivo');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao processar arquivo';
      console.error('❌ Erro no upload local:', err);
      setLocalFileError(errorMsg);
    } finally {
      setUploadingLocal(false);
      setCompressing(false);
      // Limpar input para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const apisCarregadas = gapiLoaded && pickerLoaded;

  return (
    <div className="space-y-3">
      <Tabs defaultValue="local" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="local">
            <Upload className="mr-2 h-4 w-4" />
            Computador
          </TabsTrigger>
          <TabsTrigger value="drive">
            <ImageIcon className="mr-2 h-4 w-4" />
            Google Drive
          </TabsTrigger>
        </TabsList>

        <TabsContent value="local" className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLocalFileSelect}
            className="hidden"
            id="file-upload"
          />
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingLocal || salvandoFoto}
            variant="outline"
            className="w-full"
          >
            {uploadingLocal ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {compressing ? 'Comprimindo imagem grande...' : 'Fazendo upload...'}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Selecionar Arquivo do Computador
              </>
            )}
          </Button>

          {localFileError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{localFileError}</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="drive" className="space-y-3">
      {/* Status de loading detalhado */}
      {!apisCarregadas && !loadingError && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>{loadingStatus}</AlertDescription>
        </Alert>
      )}

      {/* Erros de carregamento */}
      {loadingError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {loadingError}
            <Button
              variant="link"
              size="sm"
              onClick={() => window.location.reload()}
              className="ml-2 h-auto p-0"
            >
              Recarregar página
            </Button>
          </AlertDescription>
        </Alert>
      )}

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

      {/* Modo alternativo quando o Google estiver bloqueado */}
      <Card className="p-3">
        <div className="space-y-2">
          <p className="text-sm">Google bloqueado ou pop-up não abriu?</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() => setManualOpen((v) => !v)}
          >
            {manualOpen ? 'Esconder modo alternativo' : 'Usar link/ID do Drive (modo alternativo)'}
          </Button>

          {manualOpen && (
            <div className="space-y-2">
              <Input
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Cole aqui o link ou o ID do arquivo do Drive"
              />
              <p className="text-xs text-muted-foreground">
                Dica: compartilhe o arquivo como "Qualquer pessoa com o link" para permitir o download.
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleManualSubmit}
                  disabled={salvandoFoto || manualInput.trim().length < 10}
                  className="flex-1"
                >
                  {salvandoFoto ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Usar esta imagem'
                  )}
                </Button>
              </div>
              {manualError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{manualError}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {selectedFile && !salvandoFoto && !uploadingLocal && !error && !localFileError && (
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

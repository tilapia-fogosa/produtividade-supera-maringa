import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Camera, Save, Lock, Calendar, Loader2, Check, Eye, EyeOff, ExternalLink, Copy, CheckCircle2, XCircle } from 'lucide-react';
import { useTestGoogleCalendarConnection } from '@/hooks/use-google-calendar';

const SERVICE_ACCOUNT_EMAIL = 'supera-calendar-bot@projeto-pedagogico-comercial.iam.gserviceaccount.com';

export default function MeuPerfil() {
  const { user, profile, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [nome, setNome] = useState(profile?.full_name || '');
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [isUploadingFoto, setIsUploadingFoto] = useState(false);
  const [isSavingNome, setIsSavingNome] = useState(false);
  const [nomeSalvo, setNomeSalvo] = useState(false);
  
  // Estado para alteração de senha
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [isSavingSenha, setIsSavingSenha] = useState(false);
  const [senhaSalva, setSenhaSalva] = useState(false);
  const [erroSenha, setErroSenha] = useState('');
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  // Estado para Google Calendar
  const [gcalendarId, setGcalendarId] = useState(profile?.gcalendar_id || '');
  const [isSavingCalendar, setIsSavingCalendar] = useState(false);
  const [calendarSalvo, setCalendarSalvo] = useState(false);
  const [emailCopiado, setEmailCopiado] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');

  const testConnection = useTestGoogleCalendarConnection();

  useEffect(() => {
    if (profile?.gcalendar_id) {
      setGcalendarId(profile.gcalendar_id);
    }
  }, [profile?.gcalendar_id]);

  const getIniciais = (nome: string | null | undefined) => {
    if (!nome) return user?.email?.charAt(0).toUpperCase() || 'U';
    const partes = nome.split(' ');
    if (partes.length >= 2) {
      return `${partes[0].charAt(0)}${partes[partes.length - 1].charAt(0)}`.toUpperCase();
    }
    return nome.charAt(0).toUpperCase();
  };

  const handleFotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!tiposPermitidos.includes(file.type)) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    setIsUploadingFoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const novaUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      setFotoUrl(novaUrl);

      await supabase
        .from('profiles')
        .update({ avatar_url: novaUrl })
        .eq('id', user.id);

    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
    } finally {
      setIsUploadingFoto(false);
    }
  };

  const handleSalvarNome = async () => {
    if (!user?.id || !nome.trim()) return;

    setIsSavingNome(true);
    setNomeSalvo(false);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: nome.trim() })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      setNomeSalvo(true);
      setTimeout(() => setNomeSalvo(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar nome:', error);
    } finally {
      setIsSavingNome(false);
    }
  };

  const handleAlterarSenha = async () => {
    setErroSenha('');
    setSenhaSalva(false);

    if (!senhaAtual.trim()) {
      setErroSenha('Informe sua senha atual');
      return;
    }

    if (novaSenha.length < 6) {
      setErroSenha('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErroSenha('As senhas não coincidem');
      return;
    }

    setIsSavingSenha(true);
    try {
      // Primeiro, re-autenticar com a senha atual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: senhaAtual
      });

      if (signInError) {
        setErroSenha('Senha atual incorreta');
        setIsSavingSenha(false);
        return;
      }

      // Se a senha atual estiver correta, atualizar para a nova senha
      const { error } = await supabase.auth.updateUser({
        password: novaSenha
      });

      if (error) throw error;

      setSenhaSalva(true);
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      setTimeout(() => setSenhaSalva(false), 3000);
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      setErroSenha(error.message || 'Erro ao alterar senha');
    } finally {
      setIsSavingSenha(false);
    }
  };

  const handleCopiarEmail = async () => {
    await navigator.clipboard.writeText(SERVICE_ACCOUNT_EMAIL);
    setEmailCopiado(true);
    setTimeout(() => setEmailCopiado(false), 2000);
  };

  const handleTestarConexao = async () => {
    if (!gcalendarId.trim()) return;

    setConnectionStatus('idle');
    setConnectionMessage('');

    try {
      const result = await testConnection.mutateAsync(gcalendarId.trim());
      setConnectionStatus('success');
      setConnectionMessage(result.message);
    } catch (error: any) {
      setConnectionStatus('error');
      setConnectionMessage(error.message);
    }
  };

  const handleSalvarCalendar = async () => {
    if (!user?.id) return;

    setIsSavingCalendar(true);
    setCalendarSalvo(false);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ gcalendar_id: gcalendarId.trim() || null })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      setCalendarSalvo(true);
      setTimeout(() => setCalendarSalvo(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar calendário:', error);
    } finally {
      setIsSavingCalendar(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto space-y-3">
      <div>
        <h1 className="text-base font-bold text-foreground">Meu Perfil</h1>
        <p className="text-xs text-muted-foreground">Gerencie suas informações pessoais</p>
      </div>

      {/* Foto de Perfil */}
      <Card className="p-3">
        <CardHeader className="p-0 pb-2">
          <CardTitle className="text-sm">Foto de Perfil</CardTitle>
          <CardDescription className="text-xs">Clique na foto para alterar</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar 
                className="h-12 w-12 cursor-pointer border-2 border-primary/20 transition-transform hover:scale-105"
                onClick={handleFotoClick}
              >
                <AvatarImage src={fotoUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {getIniciais(profile?.full_name)}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={handleFotoClick}
                disabled={isUploadingFoto}
                className="absolute bottom-0 right-0 p-1 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
              >
                {isUploadingFoto ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Camera className="h-3 w-3" />
                )}
              </button>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{profile?.full_name || 'Sem nome'}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFotoChange}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Nome */}
      <Card className="p-3">
        <CardHeader className="p-0 pb-2">
          <CardTitle className="text-sm">Informações Pessoais</CardTitle>
          <CardDescription className="text-xs">Atualize seu nome de exibição</CardDescription>
        </CardHeader>
        <CardContent className="p-0 space-y-3">
          <div className="space-y-1">
            <Label htmlFor="nome" className="text-xs">Nome Completo</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome completo"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email" className="text-xs">E-mail</Label>
            <Input
              id="email"
              value={user?.email || ''}
              disabled
              className="bg-muted h-8 text-sm"
            />
            <p className="text-[10px] text-muted-foreground">O e-mail não pode ser alterado</p>
          </div>
          <Button 
            onClick={handleSalvarNome} 
            disabled={isSavingNome || !nome.trim()}
            className="w-full h-8 text-xs"
          >
            {isSavingNome ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : nomeSalvo ? (
              <Check className="h-3 w-3 mr-1" />
            ) : (
              <Save className="h-3 w-3 mr-1" />
            )}
            {nomeSalvo ? 'Salvo!' : 'Salvar Alterações'}
          </Button>
        </CardContent>
      </Card>

      {/* Alterar Senha */}
      <Card className="p-3">
        <CardHeader className="p-0 pb-2">
          <CardTitle className="text-sm flex items-center gap-1">
            <Lock className="h-3 w-3" />
            Alterar Senha
          </CardTitle>
          <CardDescription className="text-xs">Atualize sua senha de acesso</CardDescription>
        </CardHeader>
        <CardContent className="p-0 space-y-3">
          <div className="space-y-1">
            <Label htmlFor="senha-atual" className="text-xs">Senha Atual</Label>
            <div className="relative">
              <Input
                id="senha-atual"
                type={mostrarSenhaAtual ? 'text' : 'password'}
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                placeholder="Digite sua senha atual"
                className="h-8 text-sm pr-8"
              />
              <button
                type="button"
                onClick={() => setMostrarSenhaAtual(!mostrarSenhaAtual)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {mostrarSenhaAtual ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="nova-senha" className="text-xs">Nova Senha</Label>
            <div className="relative">
              <Input
                id="nova-senha"
                type={mostrarNovaSenha ? 'text' : 'password'}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="h-8 text-sm pr-8"
              />
              <button
                type="button"
                onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {mostrarNovaSenha ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirmar-senha" className="text-xs">Confirmar Nova Senha</Label>
            <div className="relative">
              <Input
                id="confirmar-senha"
                type={mostrarConfirmarSenha ? 'text' : 'password'}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Repita a nova senha"
                className="h-8 text-sm pr-8"
              />
              <button
                type="button"
                onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {mostrarConfirmarSenha ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
            </div>
          </div>
          {erroSenha && (
            <p className="text-xs text-destructive">{erroSenha}</p>
          )}
          <Button 
            onClick={handleAlterarSenha} 
            disabled={isSavingSenha || !senhaAtual || !novaSenha || !confirmarSenha}
            variant="outline"
            className="w-full h-8 text-xs"
          >
            {isSavingSenha ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : senhaSalva ? (
              <Check className="h-3 w-3 mr-1" />
            ) : (
              <Lock className="h-3 w-3 mr-1" />
            )}
            {senhaSalva ? 'Senha Alterada!' : 'Alterar Senha'}
          </Button>
        </CardContent>
      </Card>

      {/* Google Calendar */}
      <Card className="p-3">
        <CardHeader className="p-0 pb-2">
          <CardTitle className="text-sm flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Google Calendar
          </CardTitle>
          <CardDescription className="text-xs">Sincronize sua agenda com o sistema</CardDescription>
        </CardHeader>
        <CardContent className="p-0 space-y-3">
          {/* Instruções */}
          <div className="bg-muted/50 rounded-lg p-2 space-y-2">
            <p className="text-xs font-medium">Como configurar:</p>
            <ol className="text-[10px] text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Abra o Google Calendar no computador</li>
              <li>Clique em Configurações (engrenagem) → Configurações</li>
              <li>Na lista à esquerda, clique no calendário que deseja compartilhar</li>
              <li>Em "Compartilhar com pessoas específicas", adicione:</li>
            </ol>
            <div className="flex items-center gap-1 bg-background rounded-md p-1.5 border">
              <code className="text-[9px] flex-1 break-all">{SERVICE_ACCOUNT_EMAIL}</code>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCopiarEmail}
                className="shrink-0 h-6 w-6 p-0"
              >
                {emailCopiado ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Dê permissão de "Fazer alterações nos eventos"
            </p>
          </div>

          <Separator />

          {/* ID do Calendário */}
          <div className="space-y-1">
            <Label htmlFor="gcalendar" className="text-xs">ID do Calendário</Label>
            <Input
              id="gcalendar"
              value={gcalendarId}
              onChange={(e) => setGcalendarId(e.target.value)}
              placeholder="seuemail@gmail.com ou ID do calendário"
              className="h-8 text-sm"
            />
            <p className="text-[10px] text-muted-foreground">
              Geralmente é seu e-mail do Gmail ou um ID específico do calendário
            </p>
          </div>

          {/* Status da conexão */}
          {connectionStatus !== 'idle' && (
            <div className={`flex items-center gap-1 p-2 rounded-lg ${
              connectionStatus === 'success' 
                ? 'bg-green-500/10 text-green-700 dark:text-green-400' 
                : 'bg-destructive/10 text-destructive'
            }`}>
              {connectionStatus === 'success' ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              <span className="text-xs">{connectionMessage}</span>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleTestarConexao}
              disabled={testConnection.isPending || !gcalendarId.trim()}
              className="flex-1 h-8 text-xs"
            >
              {testConnection.isPending ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <ExternalLink className="h-3 w-3 mr-1" />
              )}
              Testar
            </Button>
            <Button 
              onClick={handleSalvarCalendar}
              disabled={isSavingCalendar}
              className="flex-1 h-8 text-xs"
            >
              {isSavingCalendar ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : calendarSalvo ? (
                <Check className="h-3 w-3 mr-1" />
              ) : (
                <Save className="h-3 w-3 mr-1" />
              )}
              {calendarSalvo ? 'Salvo!' : 'Salvar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

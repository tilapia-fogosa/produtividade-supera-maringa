import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Camera, Save, Lock, Calendar, Loader2, Check, Eye, EyeOff } from 'lucide-react';

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

    // Validar tipo de arquivo
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!tiposPermitidos.includes(file.type)) {
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    setIsUploadingFoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      
      // Upload para o storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const novaUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      setFotoUrl(novaUrl);

      // Atualizar no perfil
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meu Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
      </div>

      {/* Foto de Perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Foto de Perfil</CardTitle>
          <CardDescription>Clique na foto para alterar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar 
                className="h-24 w-24 cursor-pointer border-4 border-primary/20 transition-transform hover:scale-105"
                onClick={handleFotoClick}
              >
                <AvatarImage src={fotoUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                  {getIniciais(profile?.full_name)}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={handleFotoClick}
                disabled={isUploadingFoto}
                className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
              >
                {isUploadingFoto ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
            </div>
            <div>
              <p className="font-medium text-foreground">{profile?.full_name || 'Sem nome'}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações Pessoais</CardTitle>
          <CardDescription>Atualize seu nome de exibição</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome completo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              value={user?.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado</p>
          </div>
          <Button 
            onClick={handleSalvarNome} 
            disabled={isSavingNome || !nome.trim()}
            className="w-full"
          >
            {isSavingNome ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : nomeSalvo ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {nomeSalvo ? 'Salvo!' : 'Salvar Alterações'}
          </Button>
        </CardContent>
      </Card>

      {/* Alterar Senha */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Alterar Senha
          </CardTitle>
          <CardDescription>Atualize sua senha de acesso</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nova-senha">Nova Senha</Label>
            <div className="relative">
              <Input
                id="nova-senha"
                type={mostrarNovaSenha ? 'text' : 'password'}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {mostrarNovaSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmar-senha">Confirmar Nova Senha</Label>
            <div className="relative">
              <Input
                id="confirmar-senha"
                type={mostrarConfirmarSenha ? 'text' : 'password'}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Repita a nova senha"
              />
              <button
                type="button"
                onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {mostrarConfirmarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {erroSenha && (
            <p className="text-sm text-destructive">{erroSenha}</p>
          )}
          <Button 
            onClick={handleAlterarSenha} 
            disabled={isSavingSenha || !novaSenha || !confirmarSenha}
            variant="outline"
            className="w-full"
          >
            {isSavingSenha ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : senhaSalva ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              <Lock className="h-4 w-4 mr-2" />
            )}
            {senhaSalva ? 'Senha Alterada!' : 'Alterar Senha'}
          </Button>
        </CardContent>
      </Card>

      {/* Google Calendar - Placeholder */}
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar
          </CardTitle>
          <CardDescription>Conecte sua agenda do Google</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Sincronize seus eventos com o Google Calendar
              </p>
            </div>
            <Button variant="outline" disabled>
              Em breve
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

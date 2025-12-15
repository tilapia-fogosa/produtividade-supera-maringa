import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRegistroPonto, TipoRegistro } from '@/hooks/use-registro-ponto';
import { useValidateIp } from '@/hooks/use-validate-ip';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, LogIn, LogOut, Wifi, WifiOff, Loader2 } from 'lucide-react';

export default function RegistroPonto() {
  const { user, profile } = useAuth();
  const { registrosHoje, ultimoRegistroHoje, isLoading, registrarPonto } = useRegistroPonto();
  const { data: ipValidation, isLoading: isValidatingIp } = useValidateIp();

  const handleRegistrar = (tipo: TipoRegistro) => {
    registrarPonto.mutate(tipo);
  };

  // Determinar próximo tipo de registro
  const proximoTipo: TipoRegistro = ultimoRegistroHoje?.tipo_registro === 'entrada' ? 'saida' : 'entrada';

  const ipAllowed = ipValidation?.allowed ?? false;
  const buttonsDisabled = registrarPonto.isPending || isValidatingIp || !ipAllowed;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Clock className="h-6 w-6" />
              Registro de Ponto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Info do usuário */}
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Bem-vindo(a),</p>
              <p className="font-semibold text-lg">{profile?.full_name || user?.email}</p>
            </div>

            {/* Status da conexão */}
            <div className={`flex items-center justify-center gap-2 p-3 rounded-lg ${
              isValidatingIp 
                ? 'bg-muted text-muted-foreground' 
                : ipAllowed 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {isValidatingIp ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Verificando conexão...</span>
                </>
              ) : ipAllowed ? (
                <>
                  <Wifi className="h-5 w-5" />
                  <span className="text-sm">Conectado ao WiFi da empresa</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-5 w-5" />
                  <span className="text-sm">{ipValidation?.message || 'Conecte-se ao WiFi da empresa'}</span>
                </>
              )}
            </div>

            {/* Data e hora atual */}
            <div className="text-center py-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">
                {format(new Date(), "HH:mm", { locale: ptBR })}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>

            {/* Botões de registro */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={proximoTipo === 'entrada' ? 'default' : 'outline'}
                className="h-24 flex-col gap-2"
                onClick={() => handleRegistrar('entrada')}
                disabled={buttonsDisabled}
              >
                <LogIn className="h-8 w-8" />
                <span>Entrada</span>
              </Button>
              <Button
                variant={proximoTipo === 'saida' ? 'default' : 'outline'}
                className="h-24 flex-col gap-2"
                onClick={() => handleRegistrar('saida')}
                disabled={buttonsDisabled}
              >
                <LogOut className="h-8 w-8" />
                <span>Saída</span>
              </Button>
            </div>

            {/* Registros do dia */}
            {registrosHoje.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground">Registros de hoje:</h3>
                <div className="space-y-2">
                  {registrosHoje.map((registro) => (
                    <div
                      key={registro.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        {registro.tipo_registro === 'entrada' ? (
                          <LogIn className="h-4 w-4 text-green-500" />
                        ) : (
                          <LogOut className="h-4 w-4 text-red-500" />
                        )}
                        <span className="capitalize">{registro.tipo_registro}</span>
                      </div>
                      <span className="font-mono">
                        {format(new Date(registro.created_at), "HH:mm:ss")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

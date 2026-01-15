import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRegistroPonto, TipoRegistro } from '@/hooks/use-registro-ponto';
import { useEstatisticasHoras } from '@/hooks/use-registros-ponto-admin';
import { useSaldoHoras } from '@/hooks/use-saldo-horas';
import { useValidateIp } from '@/hooks/use-validate-ip';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, LogIn, LogOut, Wifi, WifiOff, Loader2, Calendar, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

export default function RegistroPonto() {
  const { user, profile } = useAuth();
  const { registros, registrosHoje, ultimoRegistroHoje, isLoading, registrarPonto } = useRegistroPonto();
  const { data: ipValidation, isLoading: isValidatingIp } = useValidateIp();
  const { data: estatisticas, isLoading: isLoadingStats } = useEstatisticasHoras(user?.id, undefined);
  const { data: saldoHoras, isLoading: isLoadingSaldo } = useSaldoHoras(user?.id);

  const handleRegistrar = (tipo: TipoRegistro) => {
    registrarPonto.mutate(tipo);
  };

  // Determinar próximo tipo de registro
  const proximoTipo: TipoRegistro = ultimoRegistroHoje?.tipo_registro === 'entrada' ? 'saida' : 'entrada';

  const ipAllowed = ipValidation?.allowed ?? false;
  const baseDisabled = registrarPonto.isPending || isValidatingIp || !ipAllowed;
  
  // Entrada: habilitado se não há registro ou último foi saída
  const entradaDisabled = baseDisabled || (ultimoRegistroHoje?.tipo_registro === 'entrada');
  // Saída: habilitado apenas se último foi entrada
  const saidaDisabled = baseDisabled || (ultimoRegistroHoje?.tipo_registro !== 'entrada');

  const formatHoras = (minutos: number) => {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return `${h}h ${m}min`;
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-4">
        <Tabs defaultValue="registro" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="registro" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Registro
            </TabsTrigger>
            <TabsTrigger value="historico" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="registro" className="mt-4">
            <Card>
              <CardHeader className="text-center pb-4">
                <CardTitle className="flex items-center justify-center gap-2 text-lg">
                  <Clock className="h-5 w-5" />
                  Registro de Ponto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Info do usuário */}
                <div className="text-center">
                  <p className="text-muted-foreground text-sm">Bem-vindo(a),</p>
                  <p className="font-semibold">{profile?.full_name || user?.email}</p>
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
                <div className="text-center py-3 bg-muted rounded-lg">
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
                    className="h-20 flex-col gap-2"
                    onClick={() => handleRegistrar('entrada')}
                    disabled={entradaDisabled}
                  >
                    <LogIn className="h-6 w-6" />
                    <span>Entrada</span>
                  </Button>
                  <Button
                    variant={proximoTipo === 'saida' ? 'default' : 'outline'}
                    className="h-20 flex-col gap-2"
                    onClick={() => handleRegistrar('saida')}
                    disabled={saidaDisabled}
                  >
                    <LogOut className="h-6 w-6" />
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
          </TabsContent>

          <TabsContent value="historico" className="mt-4 space-y-4">
            {/* Banco de Horas */}
            <Card className={`border-2 ${saldoHoras?.isPositivo ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20'}`}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {saldoHoras?.isPositivo ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                  Banco de Horas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingSaldo ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-center">
                      <p className={`text-3xl font-bold ${saldoHoras?.isPositivo ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {saldoHoras?.saldoFormatado || '+0h 0min'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Desde 01/02/2026 • {saldoHoras?.semanasCompletas || 0} semanas completas
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center text-sm">
                      <div className="p-2 bg-background rounded">
                        <p className="text-muted-foreground text-xs">Trabalhadas</p>
                        <p className="font-semibold">{saldoHoras?.horasTotaisTrabalhadas?.toFixed(1) || 0}h</p>
                      </div>
                      <div className="p-2 bg-background rounded">
                        <p className="text-muted-foreground text-xs">Esperadas</p>
                        <p className="font-semibold">{saldoHoras?.horasEsperadas || 0}h</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Estatísticas */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5" />
                  Estatísticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Hoje</p>
                      <p className="text-lg font-bold">{formatHoras(estatisticas?.horasHoje || 0)}</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Semana</p>
                      <p className="text-lg font-bold">{formatHoras(estatisticas?.horasSemana || 0)}</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Mês</p>
                      <p className="text-lg font-bold">{formatHoras(estatisticas?.horasMes || 0)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Histórico de registros */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5" />
                  Meus Registros
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : registros && registros.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Hora</TableHead>
                          <TableHead>Tipo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {registros.slice(0, 20).map((registro) => (
                          <TableRow key={registro.id}>
                            <TableCell className="text-sm">
                              {format(new Date(registro.created_at), "dd/MM/yyyy")}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {format(new Date(registro.created_at), "HH:mm:ss")}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {registro.tipo_registro === 'entrada' ? (
                                  <LogIn className="h-3 w-3 text-green-500" />
                                ) : (
                                  <LogOut className="h-3 w-3 text-red-500" />
                                )}
                                <span className="capitalize text-sm">{registro.tipo_registro}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhum registro encontrado
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
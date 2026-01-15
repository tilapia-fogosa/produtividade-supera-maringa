import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useRegistrosPontoAdmin, useEstatisticasHoras, TipoRegistro } from '@/hooks/use-registros-ponto-admin';
import { useActiveUnit } from '@/contexts/ActiveUnitContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Edit, Trash2, LogIn, LogOut, Calendar, User, Filter, BarChart3 } from 'lucide-react';
import { Label } from '@/components/ui/label';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  franqueado: 'Franqueado',
  gestor_pedagogico: 'Gestor Pedagógico',
  educador: 'Educador',
  financeiro: 'Financeiro',
  administrativo: 'Administrativo',
  estagiario: 'Estagiário',
  sala: 'Sala',
};

export default function ControlePonto() {
  const { activeUnit } = useActiveUnit();
  const [filtroUsuario, setFiltroUsuario] = useState<string>('');
  const [filtroTipo, setFiltroTipo] = useState<TipoRegistro | ''>('');
  const [filtroRole, setFiltroRole] = useState<string>('');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [usuarioEstatisticas, setUsuarioEstatisticas] = useState<string>('');
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [registroEditando, setRegistroEditando] = useState<{
    id: string;
    tipo_registro: TipoRegistro;
    created_at: string;
  } | null>(null);

  const { 
    registros, 
    usuariosComRegistros, 
    rolesDisponiveis,
    isLoading, 
    atualizarRegistro,
    excluirRegistro 
  } = useRegistrosPontoAdmin({
    userId: filtroUsuario || undefined,
    tipoRegistro: filtroTipo || undefined,
    role: filtroRole || undefined,
    dataInicio: dataInicio || undefined,
    dataFim: dataFim || undefined,
    unitId: activeUnit?.id,
  });

  const { data: estatisticas } = useEstatisticasHoras(usuarioEstatisticas || undefined, activeUnit?.id);

  const handleEdit = (registro: typeof registroEditando) => {
    if (!registro) return;
    setRegistroEditando({
      id: registro.id,
      tipo_registro: registro.tipo_registro,
      created_at: registro.created_at,
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!registroEditando) return;
    atualizarRegistro.mutate({
      id: registroEditando.id,
      tipo_registro: registroEditando.tipo_registro,
      created_at: registroEditando.created_at,
    }, {
      onSuccess: () => {
        setEditModalOpen(false);
        setRegistroEditando(null);
      },
    });
  };

  const handleDelete = (id: string) => {
    excluirRegistro.mutate(id);
  };

  const limparFiltros = () => {
    setFiltroUsuario('');
    setFiltroTipo('');
    setFiltroRole('');
    setDataInicio('');
    setDataFim('');
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-2">
        <Clock className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Controle de Ponto</h1>
      </div>

      <Tabs defaultValue="registros" className="space-y-4">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="registros" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Registros
          </TabsTrigger>
          <TabsTrigger value="estatisticas" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registros" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Funcionário</Label>
                  <Select value={filtroUsuario || "all"} onValueChange={(v) => setFiltroUsuario(v === "all" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {usuariosComRegistros?.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.full_name || u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Tipo</Label>
                  <Select value={filtroTipo || "all"} onValueChange={(v) => setFiltroTipo(v === "all" ? "" : v as TipoRegistro)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Departamento</Label>
                  <Select value={filtroRole || "all"} onValueChange={(v) => setFiltroRole(v === "all" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {rolesDisponiveis?.map((role) => (
                        <SelectItem key={role} value={role}>
                          {ROLE_LABELS[role] || role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Período</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={limparFiltros}>
                Limpar Filtros
              </Button>
            </CardContent>
          </Card>

          {/* Tabela de Registros */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Registros de Ponto</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Funcionário</TableHead>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registros?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            Nenhum registro encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        registros?.map((registro) => (
                          <TableRow key={registro.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="truncate max-w-[150px]">
                                  {registro.usuario_nome || registro.usuario_email || 'Desconhecido'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {format(new Date(registro.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {registro.tipo_registro === 'entrada' ? (
                                  <LogIn className="h-4 w-4 text-green-500" />
                                ) : (
                                  <LogOut className="h-4 w-4 text-red-500" />
                                )}
                                <span className="capitalize">{registro.tipo_registro}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(registro)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta ação não pode ser desfeita. O registro será permanentemente removido.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(registro.id)}>
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estatisticas" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Estatísticas de Horas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Selecione o funcionário</Label>
                <Select value={usuarioEstatisticas} onValueChange={setUsuarioEstatisticas}>
                  <SelectTrigger className="max-w-md">
                    <SelectValue placeholder="Selecione um funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {usuariosComRegistros?.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.full_name || u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {estatisticas && (
                <div className="space-y-6">
                  {/* Cards de resumo */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-blue-50 dark:bg-blue-900/20">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Horas Hoje</p>
                          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                            {estatisticas.horasHoje.toFixed(1)}h
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-green-50 dark:bg-green-900/20">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Horas Esta Semana</p>
                          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                            {estatisticas.horasSemana.toFixed(1)}h
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-purple-50 dark:bg-purple-900/20">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Horas Este Mês</p>
                          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                            {estatisticas.horasMes.toFixed(1)}h
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Tabela de horas por dia */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Horas por Dia</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead className="text-right">Horas</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {estatisticas.horasPorDia
                            .sort((a, b) => b.data.localeCompare(a.data))
                            .map((dia) => (
                              <TableRow key={dia.data}>
                                <TableCell>
                                  {format(new Date(dia.data + 'T12:00:00'), "EEEE, dd/MM/yyyy", { locale: ptBR })}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {dia.horas.toFixed(2)}h
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Edição */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Registro</DialogTitle>
            <DialogDescription>
              Altere os dados do registro de ponto
            </DialogDescription>
          </DialogHeader>
          {registroEditando && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tipo de Registro</Label>
                <Select
                  value={registroEditando.tipo_registro}
                  onValueChange={(v) => setRegistroEditando({ ...registroEditando, tipo_registro: v as TipoRegistro })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data e Hora</Label>
                <Input
                  type="datetime-local"
                  value={registroEditando.created_at.slice(0, 16)}
                  onChange={(e) => setRegistroEditando({ 
                    ...registroEditando, 
                    created_at: new Date(e.target.value).toISOString() 
                  })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={atualizarRegistro.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useAlertasFalta, type AlertaFalta } from '@/hooks/use-alertas-falta';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

const AlertasFalta = () => {
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [filtros, setFiltros] = useState({
    status: 'todos',
    data_inicio: '',
    data_fim: '',
    tipo_criterio: 'todos'
  });

  // Preparar filtros para a query (converter "todos" para undefined)
  const filtrosQuery = {
    status: filtros.status === 'todos' ? undefined : filtros.status,
    data_inicio: filtros.data_inicio || undefined,
    data_fim: filtros.data_fim || undefined,
    tipo_criterio: filtros.tipo_criterio === 'todos' ? undefined : filtros.tipo_criterio,
    page: paginaAtual,
    pageSize: 100
  };

  const { data, isLoading } = useAlertasFalta(filtrosQuery);
  const alertas = data?.alertas || [];
  const totalPages = data?.totalPages || 0;
  const total = data?.total || 0;

  // Resetar para página 1 quando filtros mudarem
  const handleFiltroChange = (novosFiltros: typeof filtros) => {
    setFiltros(novosFiltros);
    setPaginaAtual(1);
  };

  const formatarData = (data: string) => {
    try {
      return format(new Date(data), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return data;
    }
  };

  const formatarDataSimples = (data: string) => {
    try {
      return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return data;
    }
  };

  const getStatusIcon = (alerta: AlertaFalta) => {
    if (alerta.status === 'resolvido') {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    if (!alerta.slack_enviado) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    if (alerta.slack_erro) {
      return <AlertCircle className="w-4 h-4 text-orange-500" />;
    }
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = (alerta: AlertaFalta) => {
    if (alerta.status === 'resolvido') return 'Resolvido';
    if (!alerta.slack_enviado) return 'Não Enviado';
    if (alerta.slack_erro) return 'Erro no Envio';
    return 'Enviado';
  };

  const getTipoCriterioLabel = (tipo: string) => {
    if (tipo === 'aluno_recente') return 'Aluno Recente';
    if (tipo === 'faltas_consecutivas') return 'Faltas Consecutivas';
    return tipo;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Histórico de Alertas de Falta</h1>
        <p className="text-muted-foreground text-sm">
          Acompanhe todos os alertas de falta gerados e o status de envio para o Slack
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filtros.status}
                onValueChange={(value) => handleFiltroChange({ ...filtros, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="enviado">Enviados</SelectItem>
                  <SelectItem value="resolvido">Resolvidos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Critério</label>
              <Select
                value={filtros.tipo_criterio}
                onValueChange={(value) => handleFiltroChange({ ...filtros, tipo_criterio: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="aluno_recente">Aluno Recente</SelectItem>
                  <SelectItem value="faltas_consecutivas">Faltas Consecutivas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data Início</label>
              <Input
                type="date"
                value={filtros.data_inicio}
                onChange={(e) => handleFiltroChange({ ...filtros, data_inicio: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data Fim</label>
              <Input
                type="date"
                value={filtros.data_fim}
                onChange={(e) => handleFiltroChange({ ...filtros, data_fim: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => handleFiltroChange({ status: 'todos', data_inicio: '', data_fim: '', tipo_criterio: 'todos' })}
            >
              Limpar Filtros
            </Button>
            <span className="text-sm text-muted-foreground">
              Total: {total} {total === 1 ? 'alerta' : 'alertas'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total de Alertas</p>
              <p className="text-3xl font-bold">{total}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Enviados</p>
              <p className="text-3xl font-bold text-green-500">
                {alertas?.filter(a => a.slack_enviado && !a.slack_erro).length || 0}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Com Erro</p>
              <p className="text-3xl font-bold text-red-500">
                {alertas?.filter(a => a.slack_erro).length || 0}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Resolvidos</p>
              <p className="text-3xl font-bold text-blue-500">
                {alertas?.filter(a => a.status === 'resolvido').length || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Alertas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Alertas</CardTitle>
            <div className="text-sm text-muted-foreground">
              Página {paginaAtual} de {totalPages} ({alertas.length} alertas nesta página)
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : alertas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum alerta encontrado
            </div>
          ) : (
            <>
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data Alerta</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Professor</TableHead>
                    <TableHead>Data Falta</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status Slack</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alertas.map((alerta) => (
                    <TableRow key={alerta.id}>
                      <TableCell className="text-xs">
                        {formatarData(alerta.created_at)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {alerta.aluno?.nome || 'N/A'}
                      </TableCell>
                      <TableCell>{alerta.turma?.nome || 'N/A'}</TableCell>
                      <TableCell>{alerta.professor?.nome || 'N/A'}</TableCell>
                      <TableCell className="text-xs">
                        {formatarDataSimples(alerta.data_falta)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getTipoCriterioLabel(alerta.tipo_criterio)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(alerta)}
                          <span className="text-xs">{getStatusText(alerta)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Ver Detalhes
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                            <DialogHeader>
                              <DialogTitle>Detalhes do Alerta</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Aluno</p>
                                  <p>{alerta.aluno?.nome}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Turma</p>
                                  <p>{alerta.turma?.nome || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Professor</p>
                                  <p>{alerta.professor?.nome || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Unidade</p>
                                  <p>{alerta.unit?.name || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Data do Alerta</p>
                                  <p>{formatarData(alerta.created_at)}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Data da Falta</p>
                                  <p>{formatarDataSimples(alerta.data_falta)}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Tipo de Critério</p>
                                  <p>{getTipoCriterioLabel(alerta.tipo_criterio)}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                                  <Badge>{alerta.status}</Badge>
                                </div>
                              </div>

                              <div>
                                <p className="text-sm font-medium text-muted-foreground mb-2">Detalhes do Critério</p>
                                <pre className="bg-muted p-3 rounded text-xs overflow-auto">
                                  {JSON.stringify(alerta.detalhes, null, 2)}
                                </pre>
                              </div>

                              <div className="border-t pt-4">
                                <h4 className="font-semibold mb-3">Informações de Envio Slack</h4>
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Status de Envio</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      {getStatusIcon(alerta)}
                                      <span>{getStatusText(alerta)}</span>
                                    </div>
                                  </div>
                                  
                                  {alerta.slack_enviado_em && (
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Data de Envio</p>
                                      <p>{formatarData(alerta.slack_enviado_em)}</p>
                                    </div>
                                  )}
                                  
                                  {alerta.slack_mensagem_id && (
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">ID da Mensagem</p>
                                      <p className="font-mono text-xs">{alerta.slack_mensagem_id}</p>
                                    </div>
                                  )}
                                  
                                  {alerta.slack_erro && (
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground text-red-500">Erro</p>
                                      <pre className="bg-red-50 dark:bg-red-950 p-3 rounded text-xs overflow-auto mt-1 text-red-900 dark:text-red-100">
                                        {alerta.slack_erro}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {alerta.status === 'resolvido' && (
                                <div className="border-t pt-4">
                                  <h4 className="font-semibold mb-3">Resolução</h4>
                                  <div className="space-y-2">
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Resolvido em</p>
                                      <p>{alerta.resolvido_em ? formatarData(alerta.resolvido_em) : 'N/A'}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            </>
          )}

          {/* Paginação */}
          {!isLoading && alertas.length > 0 && totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
                      className={paginaAtual === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {/* Mostrar primeira página */}
                  {paginaAtual > 3 && (
                    <>
                      <PaginationItem>
                        <PaginationLink onClick={() => setPaginaAtual(1)} className="cursor-pointer">
                          1
                        </PaginationLink>
                      </PaginationItem>
                      {paginaAtual > 4 && (
                        <PaginationItem>
                          <span className="px-2">...</span>
                        </PaginationItem>
                      )}
                    </>
                  )}
                  
                  {/* Páginas ao redor da atual */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      return Math.abs(page - paginaAtual) <= 2;
                    })
                    .map(page => (
                      <PaginationItem key={page}>
                        <PaginationLink 
                          onClick={() => setPaginaAtual(page)}
                          isActive={paginaAtual === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                  
                  {/* Mostrar última página */}
                  {paginaAtual < totalPages - 2 && (
                    <>
                      {paginaAtual < totalPages - 3 && (
                        <PaginationItem>
                          <span className="px-2">...</span>
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink onClick={() => setPaginaAtual(totalPages)} className="cursor-pointer">
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setPaginaAtual(Math.min(totalPages, paginaAtual + 1))}
                      className={paginaAtual === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertasFalta;
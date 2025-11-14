import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useAlertasEvasaoLista, type AlertaEvasao } from '@/hooks/use-alertas-evasao-lista';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AlertasEvasao = () => {
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [filtros, setFiltros] = useState({
    status: 'todos',
    kanban_status: 'todos',
    origem_alerta: 'todos',
    data_inicio: '',
    data_fim: '',
    nome_aluno: ''
  });

  // Preparar filtros para a query (converter "todos" para undefined)
  const filtrosQuery = {
    status: filtros.status === 'todos' ? undefined : filtros.status,
    kanban_status: filtros.kanban_status === 'todos' ? undefined : filtros.kanban_status,
    origem_alerta: filtros.origem_alerta === 'todos' ? undefined : filtros.origem_alerta,
    data_inicio: filtros.data_inicio || undefined,
    data_fim: filtros.data_fim || undefined,
    nome_aluno: filtros.nome_aluno || undefined,
    page: paginaAtual,
    pageSize: 100
  };

  const { data, isLoading } = useAlertasEvasaoLista(filtrosQuery);
  const alertas = data?.alertas || [];
  const totalPages = data?.totalPages || 0;
  const total = data?.total || 0;
  const totalPendentes = data?.totalPendentes || 0;
  const totalResolvidos = data?.totalResolvidos || 0;
  const totalEmAndamento = data?.totalEmAndamento || 0;

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

  const getOrigemLabel = (origem: string) => {
    const labels: Record<string, string> = {
      'conversa_indireta': 'Conversa Indireta',
      'aviso_recepcao': 'Aviso na Recepção',
      'aviso_professor_coordenador': 'Aviso ao Professor/Coordenador',
      'aviso_whatsapp': 'Aviso no WhatsApp',
      'inadimplencia': 'Inadimplência',
      'outro': 'Outro'
    };
    return labels[origem] || origem;
  };

  const getStatusBadgeVariant = (status: string) => {
    if (status === 'resolvido') return 'default';
    if (status === 'pendente') return 'secondary';
    return 'outline';
  };

  const getKanbanBadgeVariant = (kanban: string) => {
    if (kanban === 'done') return 'default';
    if (kanban === 'in_progress') return 'secondary';
    return 'outline';
  };

  const getKanbanLabel = (kanban: string) => {
    const labels: Record<string, string> = {
      'todo': 'A Fazer',
      'in_progress': 'Em Andamento',
      'done': 'Concluído'
    };
    return labels[kanban] || kanban;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Histórico de Alertas de Evasão</h1>
        <p className="text-muted-foreground text-sm">
          Acompanhe todos os alertas de evasão registrados e seus status
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome do Aluno</label>
                <Input
                  placeholder="Buscar por nome"
                  value={filtros.nome_aluno}
                  onChange={(e) => handleFiltroChange({ ...filtros, nome_aluno: e.target.value })}
                />
              </div>

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
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="resolvido">Resolvido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status Kanban</label>
                <Select
                  value={filtros.kanban_status}
                  onValueChange={(value) => handleFiltroChange({ ...filtros, kanban_status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="todo">A Fazer</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="done">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Origem do Alerta</label>
                <Select
                  value={filtros.origem_alerta}
                  onValueChange={(value) => handleFiltroChange({ ...filtros, origem_alerta: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    <SelectItem value="conversa_indireta">Conversa Indireta</SelectItem>
                    <SelectItem value="aviso_recepcao">Aviso na Recepção</SelectItem>
                    <SelectItem value="aviso_professor_coordenador">Aviso ao Professor/Coordenador</SelectItem>
                    <SelectItem value="aviso_whatsapp">Aviso no WhatsApp</SelectItem>
                    <SelectItem value="inadimplencia">Inadimplência</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
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
          </div>

          <div className="mt-4 flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => handleFiltroChange({ 
                status: 'todos',
                kanban_status: 'todos',
                origem_alerta: 'todos',
                data_inicio: '', 
                data_fim: '', 
                nome_aluno: ''
              })}
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-3xl font-bold text-yellow-500">
                {totalPendentes}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Resolvidos</p>
              <p className="text-3xl font-bold text-green-500">
                {totalResolvidos}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Em Andamento</p>
              <p className="text-3xl font-bold text-blue-500">
                {totalEmAndamento}
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
                    <TableHead>Data</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Professor</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Kanban</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alertas.map((alerta) => (
                    <TableRow key={alerta.id}>
                      <TableCell className="text-xs">
                        {formatarData(alerta.data_alerta)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {alerta.aluno?.nome || 'N/A'}
                      </TableCell>
                      <TableCell>{alerta.aluno?.turma?.nome || 'N/A'}</TableCell>
                      <TableCell>{alerta.aluno?.turma?.professor?.nome || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getOrigemLabel(alerta.origem_alerta)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(alerta.status)}>
                          {alerta.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getKanbanBadgeVariant(alerta.kanban_status)}>
                          {getKanbanLabel(alerta.kanban_status)}
                        </Badge>
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
                              <DialogTitle>Detalhes do Alerta de Evasão</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Aluno</p>
                                  <p>{alerta.aluno?.nome}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Turma</p>
                                  <p>{alerta.aluno?.turma?.nome || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Professor</p>
                                  <p>{alerta.aluno?.turma?.professor?.nome || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Data do Alerta</p>
                                  <p>{formatarData(alerta.data_alerta)}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Origem</p>
                                  <p>{getOrigemLabel(alerta.origem_alerta)}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                                  <Badge variant={getStatusBadgeVariant(alerta.status)}>
                                    {alerta.status}
                                  </Badge>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Status Kanban</p>
                                  <Badge variant={getKanbanBadgeVariant(alerta.kanban_status)}>
                                    {getKanbanLabel(alerta.kanban_status)}
                                  </Badge>
                                </div>
                                {alerta.responsavel && (
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Responsável</p>
                                    <p>{alerta.responsavel}</p>
                                  </div>
                                )}
                                {alerta.data_retencao && (
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Data Retenção Prevista</p>
                                    <p>{formatarData(alerta.data_retencao)}</p>
                                  </div>
                                )}
                              </div>

                              {alerta.descritivo && (
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground mb-2">Descrição</p>
                                  <p className="bg-muted p-3 rounded text-sm">
                                    {alerta.descritivo}
                                  </p>
                                </div>
                              )}

                              <div className="border-t pt-4">
                                <h4 className="font-semibold mb-3">Histórico</h4>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Criado em: </span>
                                    {formatarData(alerta.created_at)}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Última atualização: </span>
                                    {formatarData(alerta.updated_at)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Paginação */}
            {totalPages > 1 && (
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
                        className={paginaAtual === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setPaginaAtual(pageNum)}
                            isActive={paginaAtual === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertasEvasao;

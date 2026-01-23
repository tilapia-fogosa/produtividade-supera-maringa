import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useAlertasEvasaoLista, type AlertaEvasao } from '@/hooks/use-alertas-evasao-lista';
import { AtividadesDrawer } from '@/components/alerta-evasao/AtividadesDrawer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AlertasEvasao = () => {
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [alertaSelecionado, setAlertaSelecionado] = useState<AlertaEvasao | null>(null);
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [filtros, setFiltros] = useState({
    status: 'todos',
    origem_alerta: 'todos',
    data_inicio: '',
    data_fim: '',
    nome_aluno: ''
  });

  // Preparar filtros para a query (converter "todos" para undefined)
  const filtrosQuery = {
    status: filtros.status === 'todos' ? undefined : filtros.status,
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
  const totalRetidos = data?.totalRetidos || 0;
  const totalEvadidos = data?.totalEvadidos || 0;

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

  const getTipoAtividadeLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'ligacao_pedagogo': 'Ligação Pedagogo',
      'ligacao_adm': 'Ligação ADM',
      'reuniao_presencial': 'Reunião Presencial',
      'contato_whatsapp': 'Contato WhatsApp',
      'acompanhamento_aula': 'Acompanhamento Aula',
      'desconto_oferecido': 'Desconto Oferecido',
      'troca_horario': 'Troca de Horário',
      'troca_professor': 'Troca de Professor',
      'outro': 'Outro'
    };
    return labels[tipo] || tipo;
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === 'retido') return 'bg-green-600 text-white hover:bg-green-700';
    if (status === 'evadido') return 'bg-red-600 text-white hover:bg-red-700';
    if (status === 'pendente') return 'bg-yellow-500 text-white hover:bg-yellow-600';
    return 'bg-muted text-white';
  };

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">Painel de Evasões</h1>

      {/* Filtros compactos */}
      <Card className="py-3">
        <CardContent className="pb-0">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs font-medium">Aluno</label>
              <Input
                placeholder="Nome"
                value={filtros.nome_aluno}
                onChange={(e) => handleFiltroChange({ ...filtros, nome_aluno: e.target.value })}
                className="h-8"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Status</label>
              <Select
                value={filtros.status}
                onValueChange={(value) => handleFiltroChange({ ...filtros, status: value })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="retido">Retido</SelectItem>
                  <SelectItem value="evadido">Evadido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Origem</label>
              <Select
                value={filtros.origem_alerta}
                onValueChange={(value) => handleFiltroChange({ ...filtros, origem_alerta: value })}
              >
                <SelectTrigger className="h-8">
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

            <div className="space-y-1">
              <label className="text-xs font-medium">De</label>
              <Input
                type="date"
                value={filtros.data_inicio}
                onChange={(e) => handleFiltroChange({ ...filtros, data_inicio: e.target.value })}
                className="h-8"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Até</label>
              <Input
                type="date"
                value={filtros.data_fim}
                onChange={(e) => handleFiltroChange({ ...filtros, data_fim: e.target.value })}
                className="h-8"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => handleFiltroChange({ 
                status: 'todos',
                origem_alerta: 'todos',
                data_inicio: '', 
                data_fim: '', 
                nome_aluno: ''
              })}
            >
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas compactas */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="py-2">
          <CardContent className="pb-0 pt-0">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold">{total}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="py-2">
          <CardContent className="pb-0 pt-0">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Pendentes</p>
              <p className="text-xl font-bold text-yellow-500">{totalPendentes}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="py-2">
          <CardContent className="pb-0 pt-0">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Retidos</p>
              <p className="text-xl font-bold text-green-500">{totalRetidos}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="py-2">
          <CardContent className="pb-0 pt-0">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Evadidos</p>
              <p className="text-xl font-bold text-red-500">{totalEvadidos}</p>
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
                    <TableHead>Etapa</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alertas.map((alerta) => (
                    <TableRow 
                      key={alerta.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        setAlertaSelecionado(alerta);
                        setDrawerAberto(true);
                      }}
                    >
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
                      <TableCell className="text-xs text-muted-foreground">
                        {alerta.ultima_atividade 
                          ? getTipoAtividadeLabel(alerta.ultima_atividade.tipo_atividade)
                          : 'Sem atividades'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeClass(alerta.status)}>
                          {alerta.status}
                        </Badge>
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

      {/* Drawer de Atividades */}
      <AtividadesDrawer 
        open={drawerAberto} 
        onClose={() => {
          setDrawerAberto(false);
          setAlertaSelecionado(null);
        }}
        alerta={alertaSelecionado}
      />
    </div>
  );
};

export default AlertasEvasao;

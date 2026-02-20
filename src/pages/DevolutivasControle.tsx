import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, Download, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useDevolutivasControle } from '@/hooks/use-devolutivas-controle';
import { useIsMobile } from '@/hooks/use-mobile';

const DevolutivasControle = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const {
    devolutivas,
    loading,
    stats,
    professoresUnicos,
    turmasUnicas,
    filtroNome,
    setFiltroNome,
    filtroProfessor,
    setFiltroProfessor,
    filtroTurma,
    setFiltroTurma,
    atualizarStatus,
  } = useDevolutivasControle();

  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedDevolutivas = React.useMemo(() => {
    if (!sortColumn) return devolutivas;

    return [...devolutivas].sort((a, b) => {
      let aValue: any = (a as any)[sortColumn];
      let bValue: any = (b as any)[sortColumn];

      if (sortColumn === 'pdf_devolutiva_url') {
        aValue = !!aValue;
        bValue = !!bValue;
      }

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [devolutivas, sortColumn, sortDirection]);

  const handleCheckboxChange = async (
    pessoaId: string,
    tipoPessoa: 'aluno' | 'funcionario',
    campo: 'impresso' | 'entregue',
    valorAtual: boolean
  ) => {
    await atualizarStatus(pessoaId, tipoPessoa, campo, !valorAtual);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando devolutivas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-2 md:px-4 space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/devolutivas/devolutiva-fim-ano')}
          className="text-azul-400 hover:text-azul-500"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-azul-500">Controle de Devolutivas</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie o status das devolutivas de fim de ano
          </p>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fotos Escolhidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.fotosEscolhidas}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.fotosEscolhidas / stats.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Impressos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.impressos}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.impressos / stats.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Entregues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.entregues}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.entregues / stats.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filtro-nome">Nome</Label>
              <Input
                id="filtro-nome"
                placeholder="Buscar por nome..."
                value={filtroNome}
                onChange={(e) => setFiltroNome(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filtro-professor">Professor</Label>
              <Select
                value={filtroProfessor || 'todos'}
                onValueChange={(value) => setFiltroProfessor(value === 'todos' ? null : value)}
              >
                <SelectTrigger id="filtro-professor">
                  <SelectValue placeholder="Todos os professores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os professores</SelectItem>
                  {professoresUnicos.map((prof) => (
                    <SelectItem key={prof} value={prof}>
                      {prof}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filtro-turma">Turma</Label>
              <Select
                value={filtroTurma || 'todas'}
                onValueChange={(value) => setFiltroTurma(value === 'todas' ? null : value)}
              >
                <SelectTrigger id="filtro-turma">
                  <SelectValue placeholder="Todas as turmas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as turmas</SelectItem>
                  {turmasUnicas.map((turma) => (
                    <SelectItem key={turma} value={turma}>
                      {turma}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Devolutivas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Devolutivas ({sortedDevolutivas.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sortedDevolutivas.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>Nenhuma devolutiva encontrada com os filtros aplicados.</p>
            </div>
          ) : isMobile ? (
            // Layout Mobile - Cards
            <div className="space-y-2 p-2">
              {sortedDevolutivas.map((dev) => (
                <Card key={`${dev.pessoa_id}_${dev.tipo_pessoa}`} className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{dev.nome}</p>
                        <p className="text-xs text-muted-foreground">{dev.turma_nome}</p>
                        {dev.professor_nome && (
                          <p className="text-xs text-muted-foreground">Prof. {dev.professor_nome}</p>
                        )}
                      </div>
                      <Badge variant={dev.tipo_pessoa === 'aluno' ? 'default' : 'secondary'}>
                        {dev.tipo_pessoa === 'aluno' ? 'Aluno' : 'Funcionário'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {dev.foto_escolhida ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-300" />
                          )}
                        </div>
                        <span className="text-xs">Foto</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`impresso-${dev.pessoa_id}`}
                          checked={dev.impresso}
                          onCheckedChange={() =>
                            handleCheckboxChange(dev.pessoa_id, dev.tipo_pessoa, 'impresso', dev.impresso)
                          }
                        />
                        <Label
                          htmlFor={`impresso-${dev.pessoa_id}`}
                          className="text-xs cursor-pointer"
                        >
                          Impresso
                        </Label>
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`entregue-${dev.pessoa_id}`}
                          checked={dev.entregue}
                          onCheckedChange={() =>
                            handleCheckboxChange(dev.pessoa_id, dev.tipo_pessoa, 'entregue', dev.entregue)
                          }
                        />
                        <Label
                          htmlFor={`entregue-${dev.pessoa_id}`}
                          className="text-xs cursor-pointer"
                        >
                          Entregue
                        </Label>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!dev.pdf_devolutiva_url}
                        className={dev.pdf_devolutiva_url ? 'text-orange-500 hover:text-orange-600' : 'text-gray-400'}
                        onClick={() => {
                          if (dev.pdf_devolutiva_url) window.open(dev.pdf_devolutiva_url, '_blank');
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            // Layout Desktop - Tabela
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('nome')}
                        className="h-8"
                      >
                        Nome
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </th>
                    <th className="text-left p-3 text-sm font-semibold">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('turma_nome')}
                        className="h-8"
                      >
                        Turma
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </th>
                    <th className="text-left p-3 text-sm font-semibold">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('professor_nome')}
                        className="h-8"
                      >
                        Professor
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </th>
                    <th className="text-center p-3 text-sm font-semibold">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('tipo_pessoa')}
                        className="h-8"
                      >
                        Tipo
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </th>
                    <th className="text-center p-3 text-sm font-semibold">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('foto_escolhida')}
                        className="h-8"
                      >
                        Foto Escolhida
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </th>
                    <th className="text-center p-3 text-sm font-semibold">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('impresso')}
                        className="h-8"
                      >
                        Impresso
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </th>
                    <th className="text-center p-3 text-sm font-semibold">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('entregue')}
                        className="h-8"
                      >
                        Entregue
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </th>
                    <th className="text-center p-3 text-sm font-semibold">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('pdf_devolutiva_url')}
                        className="h-8"
                      >
                        PDF
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDevolutivas.map((dev) => (
                    <tr
                      key={`${dev.pessoa_id}_${dev.tipo_pessoa}`}
                      className="border-b hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-3 text-sm font-medium">{dev.nome}</td>
                      <td className="p-3 text-sm text-muted-foreground">{dev.turma_nome}</td>
                      <td className="p-3 text-sm text-muted-foreground">{dev.professor_nome || '-'}</td>
                      <td className="p-3 text-center">
                        <Badge variant={dev.tipo_pessoa === 'aluno' ? 'default' : 'secondary'}>
                          {dev.tipo_pessoa === 'aluno' ? 'Aluno' : 'Funcionário'}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        {dev.foto_escolhida ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            id={`impresso-${dev.pessoa_id}`}
                            checked={dev.impresso}
                            onCheckedChange={() =>
                              handleCheckboxChange(dev.pessoa_id, dev.tipo_pessoa, 'impresso', dev.impresso)
                            }
                          />
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            id={`entregue-${dev.pessoa_id}`}
                            checked={dev.entregue}
                            onCheckedChange={() =>
                              handleCheckboxChange(dev.pessoa_id, dev.tipo_pessoa, 'entregue', dev.entregue)
                            }
                          />
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!dev.pdf_devolutiva_url}
                          className={dev.pdf_devolutiva_url ? 'text-orange-500 hover:text-orange-600' : 'text-gray-400'}
                          onClick={() => {
                            if (dev.pdf_devolutiva_url) window.open(dev.pdf_devolutiva_url, '_blank');
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DevolutivasControle;

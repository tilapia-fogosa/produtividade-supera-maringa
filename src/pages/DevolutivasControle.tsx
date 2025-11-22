import React from 'react';
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
    ordenacaoCampo,
    ordenacaoDirecao,
    toggleOrdenacao,
  } = useDevolutivasControle();

  const handleCheckboxChange = async (
    pessoaId: string,
    tipoPessoa: 'aluno' | 'funcionario',
    campo: 'impresso' | 'entregue',
    valorAtual: boolean
  ) => {
    await atualizarStatus(pessoaId, tipoPessoa, campo, !valorAtual);
  };

  const handleDownloadPdf = (pdfUrl: string) => {
    window.open(pdfUrl, '_blank');
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
            Devolutivas ({devolutivas.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {devolutivas.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>Nenhuma devolutiva encontrada com os filtros aplicados.</p>
            </div>
          ) : isMobile ? (
            // Layout Mobile - Cards
            <div className="space-y-2 p-2">
              {devolutivas.map((dev) => (
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
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!dev.pdf_devolutiva_url}
                      onClick={() => dev.pdf_devolutiva_url && handleDownloadPdf(dev.pdf_devolutiva_url)}
                      className="w-full mt-2"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {dev.pdf_devolutiva_url ? 'Baixar PDF' : 'PDF não disponível'}
                    </Button>
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
                        onClick={() => toggleOrdenacao('nome')}
                        className="hover:bg-transparent"
                      >
                        Nome
                        {ordenacaoCampo === 'nome' && (
                          <ArrowUpDown className={`ml-1 h-3 w-3 ${ordenacaoDirecao === 'desc' ? 'rotate-180' : ''}`} />
                        )}
                      </Button>
                    </th>
                    <th className="text-left p-3 text-sm font-semibold">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleOrdenacao('turma_nome')}
                        className="hover:bg-transparent"
                      >
                        Turma
                        {ordenacaoCampo === 'turma_nome' && (
                          <ArrowUpDown className={`ml-1 h-3 w-3 ${ordenacaoDirecao === 'desc' ? 'rotate-180' : ''}`} />
                        )}
                      </Button>
                    </th>
                    <th className="text-left p-3 text-sm font-semibold">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleOrdenacao('professor_nome')}
                        className="hover:bg-transparent"
                      >
                        Professor
                        {ordenacaoCampo === 'professor_nome' && (
                          <ArrowUpDown className={`ml-1 h-3 w-3 ${ordenacaoDirecao === 'desc' ? 'rotate-180' : ''}`} />
                        )}
                      </Button>
                    </th>
                    <th className="text-center p-3 text-sm font-semibold">Tipo</th>
                    <th className="text-center p-3 text-sm font-semibold">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleOrdenacao('foto_escolhida')}
                        className="hover:bg-transparent"
                      >
                        Foto Escolhida
                        {ordenacaoCampo === 'foto_escolhida' && (
                          <ArrowUpDown className={`ml-1 h-3 w-3 ${ordenacaoDirecao === 'desc' ? 'rotate-180' : ''}`} />
                        )}
                      </Button>
                    </th>
                    <th className="text-center p-3 text-sm font-semibold">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleOrdenacao('impresso')}
                        className="hover:bg-transparent"
                      >
                        Impresso
                        {ordenacaoCampo === 'impresso' && (
                          <ArrowUpDown className={`ml-1 h-3 w-3 ${ordenacaoDirecao === 'desc' ? 'rotate-180' : ''}`} />
                        )}
                      </Button>
                    </th>
                    <th className="text-center p-3 text-sm font-semibold">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleOrdenacao('entregue')}
                        className="hover:bg-transparent"
                      >
                        Entregue
                        {ordenacaoCampo === 'entregue' && (
                          <ArrowUpDown className={`ml-1 h-3 w-3 ${ordenacaoDirecao === 'desc' ? 'rotate-180' : ''}`} />
                        )}
                      </Button>
                    </th>
                    <th className="text-center p-3 text-sm font-semibold">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleOrdenacao('pdf_devolutiva_url')}
                        className="hover:bg-transparent"
                      >
                        PDF
                        {ordenacaoCampo === 'pdf_devolutiva_url' && (
                          <ArrowUpDown className={`ml-1 h-3 w-3 ${ordenacaoDirecao === 'desc' ? 'rotate-180' : ''}`} />
                        )}
                      </Button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {devolutivas.map((dev) => (
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
                          size="icon"
                          variant="ghost"
                          disabled={!dev.pdf_devolutiva_url}
                          onClick={() => dev.pdf_devolutiva_url && handleDownloadPdf(dev.pdf_devolutiva_url)}
                        >
                          <Download className={`h-4 w-4 ${dev.pdf_devolutiva_url ? 'text-primary' : 'text-muted-foreground'}`} />
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

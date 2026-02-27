import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAlunosProjetoSaoRafael } from '@/hooks/use-alunos-projeto-sao-rafael';
import { useDiariosSaoRafael } from '@/hooks/use-diarios-sao-rafael';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const mesesOptions = [
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

const currentYear = new Date().getFullYear();
const anosOptions = [currentYear - 1, currentYear, currentYear + 1].map(y => ({
  value: y.toString(),
  label: y.toString(),
}));

const DiariosSaoRafael = () => {
  const navigate = useNavigate();
  const { alunos, loading: loadingAlunos } = useAlunosProjetoSaoRafael();

  const [busca, setBusca] = useState('');
  const [alunoSelecionado, setAlunoSelecionado] = useState<{ id: string; nome: string } | null>(null);
  const [mes, setMes] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [ano, setAno] = useState(currentYear.toString());

  const mesAno = `${ano}-${mes}`;
  const { dadosAbaco, dadosAH, loading } = useDiariosSaoRafael(alunoSelecionado?.id || null, mesAno);

  const alunosFiltrados = busca
    ? alunos.filter(a => a.nome.toLowerCase().includes(busca.toLowerCase()))
    : alunos;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="container mx-auto py-4 px-2">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/projeto-sao-rafael')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-azul-500">Diários São Rafael</h1>
      </div>

      {/* Seleção de aluno */}
      {!alunoSelecionado ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Selecione um aluno</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Filtrar por nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="mb-4"
            />
            {loadingAlunos ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                {alunosFiltrados.map(aluno => (
                  <button
                    key={aluno.id}
                    onClick={() => setAlunoSelecionado({ id: aluno.id, nome: aluno.nome })}
                    className="w-full text-left px-4 py-3 rounded-md hover:bg-muted transition-colors border border-transparent hover:border-border"
                  >
                    <span className="font-medium">{aluno.nome}</span>
                    <span className="text-sm text-muted-foreground ml-2">({aluno.turma_nome})</span>
                  </button>
                ))}
                {alunosFiltrados.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">Nenhum aluno encontrado</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Header com aluno selecionado e filtros */}
          <Card className="mb-4">
            <CardContent className="pt-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Aluno</p>
                  <p className="text-lg font-semibold">{alunoSelecionado.nome}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={mes} onValueChange={setMes}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mesesOptions.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={ano} onValueChange={setAno}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {anosOptions.map(a => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm" onClick={() => setAlunoSelecionado(null)}>
                  Trocar aluno
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabs Ábaco / AH */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs defaultValue="abaco">
              <TabsList className="w-full">
                <TabsTrigger value="abaco" className="flex-1">Ábaco ({dadosAbaco.length})</TabsTrigger>
                <TabsTrigger value="ah" className="flex-1">Abrindo Horizontes ({dadosAH.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="abaco">
                {dadosAbaco.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum registro de Ábaco neste período</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Presente</TableHead>
                          <TableHead>Apostila</TableHead>
                          <TableHead>Página</TableHead>
                          <TableHead>Exercícios</TableHead>
                          <TableHead>Erros</TableHead>
                          <TableHead>% Acerto</TableHead>
                          <TableHead>Desafio</TableHead>
                          <TableHead>Reposição</TableHead>
                          <TableHead>Comentário</TableHead>
                          <TableHead>Motivo Falta</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dadosAbaco.map(item => {
                          const percentual = item.exercicios && item.exercicios > 0
                            ? Math.round(((item.exercicios - (item.erros || 0)) / item.exercicios) * 100)
                            : null;
                          return (
                            <TableRow key={item.id}>
                              <TableCell className="whitespace-nowrap">{formatDate(item.data_aula)}</TableCell>
                              <TableCell>
                                <Badge variant={item.presente ? 'default' : 'destructive'} className={item.presente ? 'bg-green-600 text-white' : ''}>
                                  {item.presente ? 'Sim' : 'Não'}
                                </Badge>
                              </TableCell>
                              <TableCell>{item.apostila || '-'}</TableCell>
                              <TableCell>{item.pagina || '-'}</TableCell>
                              <TableCell>{item.exercicios ?? '-'}</TableCell>
                              <TableCell>{item.erros ?? '-'}</TableCell>
                              <TableCell>{percentual !== null ? `${percentual}%` : '-'}</TableCell>
                              <TableCell>
                                {item.fez_desafio !== null ? (
                                  <Badge variant={item.fez_desafio ? 'default' : 'secondary'} className={item.fez_desafio ? 'bg-orange-500 text-white' : ''}>
                                    {item.fez_desafio ? 'Sim' : 'Não'}
                                  </Badge>
                                ) : '-'}
                              </TableCell>
                              <TableCell>
                                {item.is_reposicao ? (
                                  <Badge className="bg-purple-600 text-white">Sim</Badge>
                                ) : 'Não'}
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate">{item.comentario || '-'}</TableCell>
                              <TableCell className="max-w-[150px] truncate">{item.motivo_falta || '-'}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="ah">
                {dadosAH.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum registro de AH neste período</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data Correção</TableHead>
                          <TableHead>Apostila</TableHead>
                          <TableHead>Exercícios</TableHead>
                          <TableHead>Erros</TableHead>
                          <TableHead>% Acerto</TableHead>
                          <TableHead>Professor Correção</TableHead>
                          <TableHead>Comentário</TableHead>
                          <TableHead>Data Lançamento</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dadosAH.map(item => {
                          const percentual = item.exercicios && item.exercicios > 0
                            ? Math.round(((item.exercicios - (item.erros || 0)) / item.exercicios) * 100)
                            : null;
                          return (
                            <TableRow key={item.id}>
                              <TableCell className="whitespace-nowrap">{formatDate(item.data_fim_correcao)}</TableCell>
                              <TableCell>{item.apostila || '-'}</TableCell>
                              <TableCell>{item.exercicios ?? '-'}</TableCell>
                              <TableCell>{item.erros ?? '-'}</TableCell>
                              <TableCell>{percentual !== null ? `${percentual}%` : '-'}</TableCell>
                              <TableCell>{item.professor_correcao || '-'}</TableCell>
                              <TableCell className="max-w-[200px] truncate">{item.comentario || '-'}</TableCell>
                              <TableCell className="whitespace-nowrap">{formatDateTime(item.created_at)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </>
      )}
    </div>
  );
};

export default DiariosSaoRafael;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useAlunosProjetoSaoRafael } from '@/hooks/use-alunos-projeto-sao-rafael';
import { useDiariosSaoRafael, ProdutividadeAbacoItem, ProdutividadeAHItem } from '@/hooks/use-diarios-sao-rafael';
import { supabase } from '@/integrations/supabase/client';
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
  const { alunos, loading: loadingAlunos } = useAlunosProjetoSaoRafael({ includeInactive: true });

  const [busca, setBusca] = useState('');
  const [alunoSelecionado, setAlunoSelecionado] = useState<{ id: string; nome: string } | null>(null);
  const [mes, setMes] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [ano, setAno] = useState(currentYear.toString());

  // Inline editing state
  const [editingAbacoId, setEditingAbacoId] = useState<string | null>(null);
  const [editingAHId, setEditingAHId] = useState<string | null>(null);
  const [editAbaco, setEditAbaco] = useState<Partial<ProdutividadeAbacoItem>>({});
  const [editAH, setEditAH] = useState<Partial<ProdutividadeAHItem>>({});
  const [saving, setSaving] = useState(false);

  const mesAno = `${ano}-${mes}`;
  const { dadosAbaco, dadosAH, professorMap, loading, refetch } = useDiariosSaoRafael(alunoSelecionado?.id || null, mesAno);

  const alunosFiltrados = busca
    ? alunos.filter(a => a.nome.toLowerCase().includes(busca.toLowerCase()))
    : alunos;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      // Para datas tipo "2026-02-05" ou "2026-02-05T00:00:00+00:00", extrair apenas a parte da data
      const dateOnly = dateStr.substring(0, 10); // "YYYY-MM-DD"
      const [year, month, day] = dateOnly.split('-').map(Number);
      return format(new Date(year, month - 1, day), 'dd/MM/yyyy', { locale: ptBR });
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

  // Ábaco editing
  const startEditAbaco = (item: ProdutividadeAbacoItem) => {
    setEditingAbacoId(item.id);
    setEditAbaco({ ...item });
  };

  const cancelEditAbaco = () => {
    setEditingAbacoId(null);
    setEditAbaco({});
  };

  const saveAbaco = async () => {
    if (!editingAbacoId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('produtividade_abaco')
        .update({
          apostila: editAbaco.apostila || null,
          pagina: editAbaco.pagina || null,
          exercicios: editAbaco.exercicios ?? null,
          erros: editAbaco.erros ?? null,
          presente: editAbaco.presente ?? false,
          fez_desafio: editAbaco.fez_desafio ?? false,
          is_reposicao: editAbaco.is_reposicao ?? false,
          comentario: editAbaco.comentario || null,
          motivo_falta: editAbaco.motivo_falta || null,
        })
        .eq('id', editingAbacoId);

      if (error) {
        console.error('Erro ao salvar ábaco:', error);
        return;
      }

      setEditingAbacoId(null);
      setEditAbaco({});
      refetch();
    } finally {
      setSaving(false);
    }
  };

  // AH editing
  const startEditAH = (item: ProdutividadeAHItem) => {
    setEditingAHId(item.id);
    setEditAH({ ...item });
  };

  const cancelEditAH = () => {
    setEditingAHId(null);
    setEditAH({});
  };

  const saveAH = async () => {
    if (!editingAHId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('produtividade_ah')
        .update({
          apostila: editAH.apostila || null,
          exercicios: editAH.exercicios ?? null,
          erros: editAH.erros ?? null,
          professor_correcao: editAH.professor_correcao || null,
          comentario: editAH.comentario || null,
          data_fim_correcao: editAH.data_fim_correcao || null,
        })
        .eq('id', editingAHId);

      if (error) {
        console.error('Erro ao salvar AH:', error);
        return;
      }

      setEditingAHId(null);
      setEditAH({});
      refetch();
    } finally {
      setSaving(false);
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

              {/* ===== ABA ÁBACO ===== */}
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
                          <TableHead className="w-[100px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dadosAbaco.map(item => {
                          const isEditing = editingAbacoId === item.id;
                          const percentual = item.exercicios && item.exercicios > 0
                            ? Math.round(((item.exercicios - (item.erros || 0)) / item.exercicios) * 100)
                            : null;

                          if (isEditing) {
                            return (
                              <TableRow key={item.id} className="bg-muted/50">
                                <TableCell className="whitespace-nowrap">{formatDate(item.data_aula)}</TableCell>
                                <TableCell>
                                  <Checkbox
                                    checked={editAbaco.presente ?? false}
                                    onCheckedChange={(v) => setEditAbaco(prev => ({ ...prev, presente: !!v }))}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={editAbaco.apostila || ''}
                                    onChange={(e) => setEditAbaco(prev => ({ ...prev, apostila: e.target.value }))}
                                    className="h-8 w-24"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={editAbaco.pagina || ''}
                                    onChange={(e) => setEditAbaco(prev => ({ ...prev, pagina: e.target.value }))}
                                    className="h-8 w-20"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={editAbaco.exercicios ?? ''}
                                    onChange={(e) => setEditAbaco(prev => ({ ...prev, exercicios: e.target.value ? Number(e.target.value) : null }))}
                                    className="h-8 w-20"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={editAbaco.erros ?? ''}
                                    onChange={(e) => setEditAbaco(prev => ({ ...prev, erros: e.target.value ? Number(e.target.value) : null }))}
                                    className="h-8 w-20"
                                  />
                                </TableCell>
                                <TableCell>-</TableCell>
                                <TableCell>
                                  <Checkbox
                                    checked={editAbaco.fez_desafio ?? false}
                                    onCheckedChange={(v) => setEditAbaco(prev => ({ ...prev, fez_desafio: !!v }))}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Checkbox
                                    checked={editAbaco.is_reposicao ?? false}
                                    onCheckedChange={(v) => setEditAbaco(prev => ({ ...prev, is_reposicao: !!v }))}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={editAbaco.comentario || ''}
                                    onChange={(e) => setEditAbaco(prev => ({ ...prev, comentario: e.target.value }))}
                                    className="h-8 w-40"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={editAbaco.motivo_falta || ''}
                                    onChange={(e) => setEditAbaco(prev => ({ ...prev, motivo_falta: e.target.value }))}
                                    className="h-8 w-32"
                                  />
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button size="icon" variant="ghost" onClick={saveAbaco} disabled={saving} className="h-8 w-8">
                                      <Check className="h-4 w-4 text-green-600" />
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={cancelEditAbaco} disabled={saving} className="h-8 w-8">
                                      <X className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          }

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
                              <TableCell>
                                <Button size="icon" variant="ghost" onClick={() => startEditAbaco(item)} className="h-8 w-8">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* ===== ABA AH ===== */}
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
                          <TableHead className="w-[100px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dadosAH.map(item => {
                          const isEditing = editingAHId === item.id;
                          const percentual = item.exercicios && item.exercicios > 0
                            ? Math.round(((item.exercicios - (item.erros || 0)) / item.exercicios) * 100)
                            : null;

                          if (isEditing) {
                            return (
                              <TableRow key={item.id} className="bg-muted/50">
                                <TableCell>
                                  <Input
                                    type="date"
                                    value={editAH.data_fim_correcao || ''}
                                    onChange={(e) => setEditAH(prev => ({ ...prev, data_fim_correcao: e.target.value }))}
                                    className="h-8 w-36"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={editAH.apostila || ''}
                                    onChange={(e) => setEditAH(prev => ({ ...prev, apostila: e.target.value }))}
                                    className="h-8 w-24"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={editAH.exercicios ?? ''}
                                    onChange={(e) => setEditAH(prev => ({ ...prev, exercicios: e.target.value ? Number(e.target.value) : null }))}
                                    className="h-8 w-20"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={editAH.erros ?? ''}
                                    onChange={(e) => setEditAH(prev => ({ ...prev, erros: e.target.value ? Number(e.target.value) : null }))}
                                    className="h-8 w-20"
                                  />
                                </TableCell>
                                <TableCell>-</TableCell>
                                <TableCell>
                                  <Input
                                    value={editAH.professor_correcao || ''}
                                    onChange={(e) => setEditAH(prev => ({ ...prev, professor_correcao: e.target.value }))}
                                    className="h-8 w-32"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={editAH.comentario || ''}
                                    onChange={(e) => setEditAH(prev => ({ ...prev, comentario: e.target.value }))}
                                    className="h-8 w-40"
                                  />
                                </TableCell>
                                <TableCell className="whitespace-nowrap">{formatDateTime(item.created_at)}</TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button size="icon" variant="ghost" onClick={saveAH} disabled={saving} className="h-8 w-8">
                                      <Check className="h-4 w-4 text-green-600" />
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={cancelEditAH} disabled={saving} className="h-8 w-8">
                                      <X className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          }

                          return (
                            <TableRow key={item.id}>
                              <TableCell className="whitespace-nowrap">{formatDate(item.data_fim_correcao)}</TableCell>
                              <TableCell>{item.apostila || '-'}</TableCell>
                              <TableCell>{item.exercicios ?? '-'}</TableCell>
                              <TableCell>{item.erros ?? '-'}</TableCell>
                              <TableCell>{percentual !== null ? `${percentual}%` : '-'}</TableCell>
                              <TableCell>{(item.professor_correcao && professorMap[item.professor_correcao]) || item.professor_correcao || '-'}</TableCell>
                              <TableCell className="max-w-[200px] truncate">{item.comentario || '-'}</TableCell>
                              <TableCell className="whitespace-nowrap">{formatDateTime(item.created_at)}</TableCell>
                              <TableCell>
                                <Button size="icon" variant="ghost" onClick={() => startEditAH(item)} className="h-8 w-8">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TableCell>
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

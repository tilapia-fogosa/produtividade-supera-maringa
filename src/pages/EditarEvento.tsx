import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, User, Users, Plus, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

export default function EditarEvento() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [evento, setEvento] = useState<any>(null);
  const [alunosEvento, setAlunosEvento] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      buscarEvento();
    }
  }, [id]);

  const buscarEvento = async () => {
    setLoading(true);
    try {
      // Buscar evento
      const { data: eventoData, error: eventoError } = await supabase
        .from('eventos')
        .select('*')
        .eq('id', id)
        .eq('active', true)
        .single();

      if (eventoError) throw eventoError;

      if (eventoData) {
        setEvento(eventoData);
        
        // Buscar participantes do evento
        const { data: participantesData, error: participantesError } = await supabase
          .from('evento_participantes')
          .select(`
            id,
            forma_pagamento,
            aluno_id,
            alunos!inner(
              id,
              nome,
              turma_id,
              turmas(id, nome, professor_id, professores(id, nome))
            )
          `)
          .eq('evento_id', id);

        if (participantesError) throw participantesError;

        const participantesFormatados = participantesData.map((p: any) => ({
          id: p.alunos.id,
          nome: p.alunos.nome,
          turma: p.alunos.turmas?.nome || 'Sem turma',
          professor: p.alunos.turmas?.professores?.nome || 'Sem professor',
          formaPagamento: p.forma_pagamento
        }));

        setAlunosEvento(participantesFormatados);
      } else {
        toast({
          title: "Evento não encontrado",
          description: "O evento solicitado não existe.",
          variant: "destructive"
        });
        navigate('/eventos');
      }
    } catch (error) {
      console.error('Erro ao buscar evento:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do evento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


const getTipoColor = (tipo: string) => {
  switch (tipo) {
    case "Reunião":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "Treinamento":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "Avaliação":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

const formatarData = (dataString: string) => {
  const data = new Date(dataString);
  return {
    data: data.toLocaleDateString("pt-BR"),
    hora: data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  };
};

const AdicionarAlunoModal = ({ onAlunoAdicionado, alunosJaCadastrados }: { 
  onAlunoAdicionado: (aluno: any) => void;
  alunosJaCadastrados: any[];
}) => {
  const [open, setOpen] = useState(false);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    alunoId: '',
    formaPagamento: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      buscarAlunos();
    }
  }, [open]);

  const buscarAlunos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alunos')
        .select(`
          id,
          nome,
          turma_id,
          turmas(id, nome, professor_id, professores(id, nome))
        `)
        .eq('active', true)
        .order('nome');

      if (error) throw error;

      const alunosFormatados = data.map((aluno: any) => ({
        id: aluno.id,
        nome: aluno.nome,
        turma: aluno.turmas?.nome || 'Sem turma',
        professor: aluno.turmas?.professores?.nome || 'Sem professor'
      }));

      setAlunos(alunosFormatados);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar alunos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const alunosDisponivelsFiltrados = alunos
    .filter(aluno => !alunosJaCadastrados.some(cadastrado => cadastrado.id === aluno.id))
    .filter(aluno => aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.alunoId || !formData.formaPagamento) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive"
      });
      return;
    }

    const alunoSelecionado = alunos.find(a => a.id === formData.alunoId);
    if (alunoSelecionado) {
      const novoAlunoEvento = {
        ...alunoSelecionado,
        formaPagamento: formData.formaPagamento
      };

      onAlunoAdicionado(novoAlunoEvento);
      setFormData({ alunoId: '', formaPagamento: '' });
      setSearchTerm('');
      setOpen(false);
      
      toast({
        title: "Sucesso",
        description: "Aluno adicionado ao evento!"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Aluno
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Aluno ao Evento</DialogTitle>
          <DialogDescription>
            Selecione um aluno e a forma de pagamento.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Buscar Aluno</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Digite o nome do aluno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="aluno">Aluno * {loading && "(Carregando...)"}</Label>
            <Select 
              value={formData.alunoId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, alunoId: value }))}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Carregando alunos..." : "Selecione um aluno"} />
              </SelectTrigger>
              <SelectContent>
                {alunosDisponivelsFiltrados.length === 0 && !loading ? (
                  <div className="p-2 text-center text-muted-foreground">Nenhum aluno encontrado</div>
                ) : (
                  alunosDisponivelsFiltrados.map(aluno => (
                    <SelectItem key={aluno.id} value={aluno.id.toString()}>
                      {aluno.nome} - {aluno.turma} ({aluno.professor})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="formaPagamento">Forma de Pagamento *</Label>
            <Select value={formData.formaPagamento} onValueChange={(value) => setFormData(prev => ({ ...prev, formaPagamento: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cartão">Cartão</SelectItem>
                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                <SelectItem value="PIX">PIX</SelectItem>
                <SelectItem value="Carimbo">Carimbo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Adicionar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

  const adicionarAluno = async (novoAluno: any) => {
    try {
      const { error } = await supabase
        .from('evento_participantes')
        .insert({
          evento_id: id,
          aluno_id: novoAluno.id,
          forma_pagamento: novoAluno.formaPagamento
        });

      if (error) throw error;

      setAlunosEvento(prev => [...prev, novoAluno]);
      
      toast({
        title: "Sucesso",
        description: "Aluno adicionado ao evento!"
      });
    } catch (error) {
      console.error('Erro ao adicionar aluno:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar aluno ao evento",
        variant: "destructive"
      });
    }
  };

  const removerAluno = async (alunoId: string) => {
    try {
      const { error } = await supabase
        .from('evento_participantes')
        .delete()
        .eq('evento_id', id)
        .eq('aluno_id', alunoId);

      if (error) throw error;

      setAlunosEvento(prev => prev.filter(aluno => aluno.id !== alunoId));
      
      toast({
        title: "Aluno removido",
        description: "Aluno removido do evento com sucesso."
      });
    } catch (error) {
      console.error('Erro ao remover aluno:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover aluno do evento",
        variant: "destructive"
      });
    }
  };

  const vagasDisponiveis = evento ? evento.numero_vagas - alunosEvento.length : 0;
  const { data, hora } = evento ? formatarData(evento.data_evento) : { data: '', hora: '' };

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!evento) {
    return <div>Evento não encontrado</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/eventos')}
            className="mb-4"
          >
            ← Voltar para Eventos
          </Button>
          <h1 className="text-3xl font-bold">Editar Evento</h1>
          <p className="text-muted-foreground">
            Gerencie as informações do evento e participantes
          </p>
        </div>
      </div>

      {/* Informações do Evento */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl">{evento.titulo}</CardTitle>
              <CardDescription className="mt-1">
                {evento.descricao}
              </CardDescription>
            </div>
            <Badge className={getTipoColor(evento.tipo)}>
              {evento.tipo}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{data}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{hora}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{evento.local}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{evento.responsavel}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{evento.numero_vagas} vagas totais</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className={vagasDisponiveis > 0 ? "text-green-600" : "text-red-600"}>
                {vagasDisponiveis} vagas disponíveis
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alunos Cadastrados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Alunos Cadastrados ({alunosEvento.length})</CardTitle>
              <CardDescription>
                Lista de alunos inscritos no evento
              </CardDescription>
            </div>
            {vagasDisponiveis > 0 && (
              <AdicionarAlunoModal 
                onAlunoAdicionado={adicionarAluno}
                alunosJaCadastrados={alunosEvento}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {alunosEvento.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Professor</TableHead>
                  <TableHead>Forma de Pagamento</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alunosEvento.map((aluno) => (
                  <TableRow key={aluno.id}>
                    <TableCell className="font-medium">{aluno.nome}</TableCell>
                    <TableCell>{aluno.turma}</TableCell>
                    <TableCell>{aluno.professor}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {aluno.formaPagamento}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removerAluno(aluno.id)}
                        className="gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum aluno cadastrado ainda
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}